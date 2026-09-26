import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "ubaid-fast-foodz-demo-secret";

export type AuthUser = { id: string; role: Role; email: string; name: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

async function loadActiveUser(payload: AuthUser): Promise<AuthUser | null> {
  const account = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { isActive: true, role: true, email: true, name: true },
  });
  if (!account?.isActive) return null;
  return {
    id: payload.id,
    role: account.role,
    email: account.email,
    name: account.name,
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
      const user = await loadActiveUser(payload);
      if (user) req.user = user;
    } catch {
      /* ignore */
    }
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    const user = await loadActiveUser(payload);
    if (!user) {
      return res.status(403).json({ error: "This account is disabled. Ask an admin." });
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
