import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { allowedOrigins } from "../middleware/security";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "ubaid-fast-foodz-demo-secret";

type SocketUser = { id: string; role: Role };

let io: Server | null = null;

export function initRealtime(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins(), credentials: true },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    const token = String(socket.handshake.auth?.token || "");
    if (!token) return next();
    try {
      const payload = jwt.verify(token, JWT_SECRET) as SocketUser;
      const account = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { isActive: true, role: true },
      });
      if (account?.isActive) {
        socket.data.user = { id: payload.id, role: account.role };
      }
      next();
    } catch {
      next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser | undefined;
    if (user?.role === Role.ADMIN || user?.role === Role.CHEF) {
      socket.join("ops");
    }
    if (user?.role === Role.RIDER) {
      socket.join(`rider:${user.id}`);
    }
    if (user?.role === Role.CUSTOMER) {
      socket.join(`customer:${user.id}`);
    }
    if (user) socket.join(`user:${user.id}`);

    socket.on("watch-order", (orderId: string) => {
      if (typeof orderId === "string" && orderId.length < 80) {
        socket.join(`order:${orderId}`);
      }
    });
  });

  return io;
}

export function emitOrderChange(event: "order:created" | "order:updated", order: { id: string; riderId?: string | null; customerId?: string | null }) {
  if (!io) return;
  const payload = { event, orderId: order.id, at: Date.now() };
  io.to("ops").emit(event, payload);
  io.to(`order:${order.id}`).emit(event, payload);
  if (order.customerId) io.to(`customer:${order.customerId}`).emit(event, payload);
  if (order.riderId) io.to(`rider:${order.riderId}`).emit(event, payload);
}
