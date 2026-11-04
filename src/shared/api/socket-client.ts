import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined" ? window.location.origin : undefined);
    socket = io(url, {
      auth: (callback) => {
        fetch("/api/socket-token", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) throw new Error("Socket authentication failed");
            return response.json() as Promise<{ token: string }>;
          })
          .then(({ token }) => callback({ token }))
          .catch(() => callback({}));
      },
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 5000,
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") socket?.connect();
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
