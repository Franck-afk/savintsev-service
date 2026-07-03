import { createServer } from "http";
import { Server } from "socket.io";
import type { Socket as ServerSocket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const socketPort = parseInt(process.env.SOCKET_PORT || "3001", 10);
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const prisma = new PrismaClient();

interface MessagePayload {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  orderId?: string | null;
  createdAt: string;
  sender: { id: string; name: string | null };
}

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: APP_URL, methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e6,
});

io.use(async (socket, next) => {
  const userId = socket.handshake.query.userId as string | undefined;
  if (!userId || typeof userId !== "string") {
    return next(new Error("userId required"));
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return next(new Error("Invalid userId"));
    }
    next();
  } catch {
    next(new Error("Auth failed"));
  }
});

io.on("connection", (socket: ServerSocket) => {
  const userId = socket.handshake.query.userId as string;
  socket.join(userId);

  socket.on("send-message", (data: MessagePayload) => {
    if (!data.receiverId || !data.content || !data.senderId) return;
    if (data.senderId !== userId) return;
    if (data.content.length > 5000) return;
    io.to(data.receiverId).emit("new-message", data);
  });

  socket.on("order-stage-updated", (data: { orderId: string; ownerId: string; currentStage: number; status: string }) => {
    if (!data.orderId || !data.ownerId) return;
    io.to(data.ownerId).emit("order-stage-refreshed", data);
  });

  socket.on("order-deleted", (data: { orderId: string; ownerId: string }) => {
    if (!data.orderId || !data.ownerId) return;
    io.to(data.ownerId).emit("order-removed", data.orderId);
  });

  socket.on("dialog-deleted", (data: { deletedBy: string; notifyUserId: string }) => {
    if (!data.notifyUserId) return;
    io.to(data.notifyUserId).emit("dialog-removed", data.deletedBy);
  });

  socket.on("dialogs-cleared", () => {
    socket.broadcast.emit("dialogs-refresh");
  });
});

httpServer.listen(socketPort, () => {
  console.log(`> Socket.IO ready on port ${socketPort}`);
});
