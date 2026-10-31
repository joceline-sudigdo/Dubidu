import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { verifyToken } from "./auth.js";

let io: Server | null = null;

/**
 * Socket.IO untuk chat & notifikasi realtime.
 * Frontend: `io(API_URL, { auth: { token } })`, lalu dengarkan event
 * `message:new`, `message:read`, `notification:new`.
 */
export function initRealtime(server: HttpServer) {
  io = new Server(server, { cors: { origin: "*" } });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("unauthorized"));
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
