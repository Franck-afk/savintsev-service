import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
loadEnvConfig(process.cwd(), dev);

if (dev && !process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = randomBytes(32).toString("hex");
}

const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });

app.prepare().then(async () => {
  const { attachSocketHandlers, getAllowedSocketOrigins } = await import("./src/shared/lib/socket-io");
  const httpServer = createServer();
  const handler = app.getRequestHandler();

  const allowedOrigins: (string | RegExp)[] = [
    ...getAllowedSocketOrigins([`http://${hostname}:${port}`]),
  ];
  if (dev) allowedOrigins.push(/^https:\/\/[^/]+\.v0\.build$/);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });
  attachSocketHandlers(io);

  httpServer.on("request", (req: IncomingMessage, res: ServerResponse) => {
    const { pathname } = parse(req.url || "", true);
    if (!pathname || pathname.startsWith("/socket.io")) return;
    handler(req, res);
  });


  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
