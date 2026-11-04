import { createServer } from "http";
import { Server } from "socket.io";
import { attachSocketHandlers, getAllowedSocketOrigins } from "./src/shared/lib/socket-io";

const socketPort = parseInt(process.env.SOCKET_PORT || process.env.PORT || "3001", 10);
const httpServer = createServer();

const allowedOrigins: (string | RegExp)[] = [
  ...getAllowedSocketOrigins(["http://localhost:3000"]),
];
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push(/^https:\/\/[^/]+\.v0\.build$/);
}

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e6,
});
attachSocketHandlers(io);

httpServer.listen(socketPort, () => {
  console.log(`> Socket.IO ready on port ${socketPort}`);
});
