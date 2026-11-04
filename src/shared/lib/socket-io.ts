import { decode } from "next-auth/jwt";
import type { Server, Socket } from "socket.io";
import { prisma } from "@/shared/api/prisma";
import {
  canEmitDialogDeletion,
  canEmitOrderDeletion,
  canEmitOrderStageUpdate,
  canEmitPaymentNotice,
  type SocketRole,
} from "@/shared/lib/socket-authorization";

export const SOCKET_TOKEN_SALT = "savintsev-service-socket";
export const SOCKET_TOKEN_TTL_SECONDS = 300;

interface AuthenticatedSocketData {
  userId: string;
  role: SocketRole;
  expiresAt: number;
}

type AuthenticatedSocket = Socket & { data: AuthenticatedSocketData };
type EventRecord = Record<string, unknown>;

export function getAllowedSocketOrigins(fallbackOrigins: string[]): string[] {
  const vercelOrigin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
    : undefined;
  const configuredOrigins = process.env.SOCKET_ALLOWED_ORIGINS?.split(",") ?? [];
  const origins = [
    ...fallbackOrigins,
    process.env.NEXTAUTH_URL,
    vercelOrigin,
    ...configuredOrigins,
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));

  return [...new Set(origins.map((origin) => new URL(origin).origin))];
}

function asRecord(value: unknown): EventRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as EventRecord
    : null;
}

function readString(value: unknown, maxLength = 64): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength
    ? value
    : null;
}

export function attachSocketHandlers(io: Server): void {
  io.use(async (socket, next) => {
    const secret = process.env.AUTH_SECRET;
    const tokenValue = socket.handshake.auth?.token;
    if (typeof tokenValue !== "string" || !secret) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const token = await decode({
        token: tokenValue,
        secret,
        salt: SOCKET_TOKEN_SALT,
      });
      if (
        !token ||
        token.purpose !== "socket" ||
        typeof token.sub !== "string" ||
        typeof token.exp !== "number" ||
        token.exp <= Date.now() / 1000
      ) {
        next(new Error("Unauthorized"));
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true, role: true },
      });
      if (!user) {
        next(new Error("Unauthorized"));
        return;
      }

      const authenticatedSocket = socket as AuthenticatedSocket;
      authenticatedSocket.data.userId = user.id;
      authenticatedSocket.data.role = user.role;
      authenticatedSocket.data.expiresAt = token.exp;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const actorId = socket.data.userId;
    const actorRole = socket.data.role;
    socket.join(actorId);

    const expiryTimer = setTimeout(
      () => socket.disconnect(true),
      Math.max(0, socket.data.expiresAt * 1000 - Date.now()),
    );
    socket.once("disconnect", () => clearTimeout(expiryTimer));

    socket.on("send-message", async (value: unknown) => {
      const event = asRecord(value);
      const messageId = readString(event?.id);
      if (!messageId) return;

      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: { sender: { select: { id: true, name: true } } },
        });
        if (!message || message.senderId !== actorId) return;

        io.to(message.receiverId).emit("new-message", {
          ...message,
          createdAt: message.createdAt.toISOString(),
        });
      } catch (error) {
        console.error("Socket message notification failed:", error);
      }
    });

    socket.on("order-stage-updated", async (value: unknown) => {
      const event = asRecord(value);
      const orderId = readString(event?.orderId);
      if (!orderId) return;

      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true, masterId: true, currentStage: true, status: true },
        });
        if (!order || !canEmitOrderStageUpdate(actorId, actorRole, order)) return;

        io.to(order.userId).emit("order-stage-refreshed", {
          orderId,
          ownerId: order.userId,
          currentStage: order.currentStage,
          status: order.status,
        });
      } catch (error) {
        console.error("Socket order notification failed:", error);
      }
    });

    socket.on("order-deleted", (value: unknown) => {
      const event = asRecord(value);
      const orderId = readString(event?.orderId);
      const ownerId = readString(event?.ownerId);
      if (!orderId || !ownerId || !canEmitOrderDeletion(actorId, actorRole, ownerId)) return;

      io.to(ownerId).emit("order-removed", orderId);
    });

    socket.on("dialog-deleted", (value: unknown) => {
      const event = asRecord(value);
      const deletedBy = readString(event?.deletedBy);
      const notifyUserId = readString(event?.notifyUserId);
      if (!deletedBy || !notifyUserId || !canEmitDialogDeletion(actorId, deletedBy)) return;

      io.to(notifyUserId).emit("dialog-removed", actorId);
    });

    socket.on("payment-created", async (value: unknown) => {
      const event = asRecord(value);
      const paymentId = readString(event?.id);
      if (!paymentId) return;

      try {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { order: { select: { userId: true, masterId: true } } },
        });
        if (
          !payment ||
          payment.status !== "Pending" ||
          !canEmitPaymentNotice(actorId, actorRole, payment.order.masterId)
        ) {
          return;
        }

        io.to(payment.order.userId).emit("payment-created", {
          id: payment.id,
          amount: payment.amount,
          qrData: payment.qrData,
          orderId: payment.orderId,
          ownerId: payment.order.userId,
        });
      } catch (error) {
        console.error("Socket payment notification failed:", error);
      }
    });

    socket.on("dialogs-cleared", () => {
      if (actorRole === "Owner") socket.broadcast.emit("dialogs-refresh");
    });
  });
}
