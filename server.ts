import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import type { Socket as ServerSocket } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });

interface MessagePayload {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  orderId?: string | null;
  createdAt: string;
  sender: { id: string; name: string | null };
}

interface StageUpdatePayload {
  orderId: string;
  ownerId: string;
  currentStage: number;
  status: string;
}

app.prepare().then(() => {
  const httpServer = createServer();
  const handler = app.getRequestHandler();

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? `http://${hostname}:${port}` : undefined,
      methods: ["GET", "POST"],
    },
  });

  httpServer.on("request", (req: IncomingMessage, res: ServerResponse) => {
    const { pathname } = parse(req.url || "", true);
    if (!pathname || pathname.startsWith("/socket.io")) return;
    handler(req, res);
  });

  io.use(async (socket, next) => {
    const userId = socket.handshake.query.userId as string | undefined;
    if (!userId || typeof userId !== "string" || userId.length < 5 || userId.length > 30) {
      return next(new Error("Invalid userId"));
    }
    if (!/^[a-z0-9]+$/.test(userId)) {
      return next(new Error("Invalid userId format"));
    }
    next();
  });

  io.on("connection", (socket: ServerSocket) => {
    const userId = socket.handshake.query.userId as string;
    socket.join(userId);

    socket.on("send-message", (data: MessagePayload) => {
      io.to(data.receiverId).emit("new-message", data);
    });

    socket.on("order-stage-updated", (data: StageUpdatePayload) => {
      io.to(data.ownerId).emit("order-stage-refreshed", data);
    });

    socket.on("order-deleted", (data: { orderId: string; ownerId: string }) => {
      io.to(data.ownerId).emit("order-removed", data.orderId);
    });

    socket.on("dialog-deleted", (data: { deletedBy: string; notifyUserId: string }) => {
      io.to(data.notifyUserId).emit("dialog-removed", data.deletedBy);
    });

    socket.on("dialogs-cleared", () => {
      socket.broadcast.emit("dialogs-refresh");
    });

    socket.on("payment-created", (data: { orderId: string; ownerId: string; [key: string]: unknown }) => {
      if (!data.orderId || !data.ownerId) return;
      io.to(data.ownerId).emit("payment-created", data);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
