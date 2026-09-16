import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, signToken } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: "An account with this email already exists." });

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: Role.CUSTOMER,
      phone,
    },
  });
  const payload = { id: user.id, role: user.role, email: user.email, name: user.name };
  res.json({ token: signToken(payload), user: { ...payload, phone: user.phone } });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  const payload = { id: user.id, role: user.role, email: user.email, name: user.name };
  res.json({ token: signToken(payload), user: { ...payload, phone: user.phone } });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  });
});
