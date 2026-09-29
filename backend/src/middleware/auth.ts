import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { jwtSecret } from "../lib/jwt-secret";
import { prisma } from "../lib/prisma";
import { readSessionCookie } from "../lib/session-cookie";

const JWT_SECRET = jwtSecret();

export type AuthUser = { id: string; role: Role; email: string; name: string; tv?: number };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name, tv: user.tv ?? 0 },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function bearerOrCookie(req: Request) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return readSessionCookie(req.headers.cookie);
}

async function loadActiveUser(payload: AuthUser & { tv?: number }): Promise<AuthUser | null> {
  const account = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { isActive: true, role: true, email: true, name: true, tokenVersion: true },
  });
  if (!account?.isActive) return null;
  const tv = typeof payload.tv === "number" ? payload.tv : 0;
  if (tv !== account.tokenVersion) return null;
  return {
    id: payload.id,
    role: account.role,
    email: account.email,
    name: account.name,
    tv: account.tokenVersion,
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = bearerOrCookie(req);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
      const user = await loadActiveUser(payload);
      if (user) req.user = user;
    } catch {
      /* ignore */
    }
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerOrCookie(req);
  if (!token) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await loadActiveUser(payload);
    if (!user) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have access to this area." });
    }
    next();
  };
}
