import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { generateSecret, generateURI, verifyTotp } from "../lib/totp";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, signToken } from "../middleware/auth";
import { storeNameFrom } from "../lib/branding";
import { sendPasswordResetEmail } from "../lib/email";
import { getStoreSettings } from "../lib/settings-data";
import { authLimiter } from "../middleware/security";

const JWT_SECRET = process.env.JWT_SECRET || "ubaid-fast-foodz-demo-secret";

export const authRouter = Router();

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  totpEnabled?: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    totpEnabled: Boolean(user.totpEnabled),
  };
}

authRouter.post("/register", authLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: "An account with this email already exists." });

  const normalizedPhone = phone?.replace(/[^\d+]/g, "").trim() || null;
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 12),
      role: Role.CUSTOMER,
      phone: normalizedPhone,
    },
  });

  if (normalizedPhone && normalizedPhone.length >= 10) {
    const digits = normalizedPhone.slice(-10);
    await prisma.order.updateMany({
      where: {
        customerId: null,
        customerPhone: { endsWith: digits },
      },
      data: { customerId: user.id },
    });
  }

  const payload = { id: user.id, role: user.role, email: user.email, name: user.name };
  res.json({ token: signToken(payload), user: publicUser(user) });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: "This account is disabled. Ask an admin." });
  }

  if (user.totpEnabled && user.totpSecret) {
    const challengeToken = jwt.sign({ id: user.id, typ: "2fa" }, JWT_SECRET, { expiresIn: "5m" });
    return res.json({ requiresTwoFactor: true, challengeToken });
  }

  const payload = { id: user.id, role: user.role, email: user.email, name: user.name };
  res.json({ token: signToken(payload), user: publicUser(user) });
});

authRouter.post("/login/2fa", authLimiter, async (req, res) => {
  const { challengeToken, code } = req.body as { challengeToken?: string; code?: string };
  if (!challengeToken || !code) {
    return res.status(400).json({ error: "Authenticator code is required." });
  }
  try {
    const payload = jwt.verify(challengeToken, JWT_SECRET) as { id: string; typ?: string };
    if (payload.typ !== "2fa") throw new Error("bad");
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user?.totpEnabled || !user.totpSecret || !user.isActive) {
      return res.status(401).json({ error: "Two-factor login is not available." });
    }
    if (!verifyTotp(user.totpSecret, String(code))) {
      return res.status(401).json({ error: "Invalid authenticator code." });
    }
    const auth = { id: user.id, role: user.role, email: user.email, name: user.name };
    res.json({ token: signToken(auth), user: publicUser(user) });
  } catch {
    return res.status(401).json({ error: "Challenge expired. Sign in again." });
  }
});

function clientAppUrl() {
  const raw = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";
  return raw.split(",")[0].trim();
}

authRouter.post("/forgot-password", authLimiter, async (req, res) => {
  const email = String((req.body as { email?: string }).email || "")
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });

  const user = await prisma.user.findUnique({ where: { email } });
  if (
    user &&
    user.isActive &&
    (user.role === Role.CUSTOMER ||
      user.role === Role.ADMIN ||
      user.role === Role.CHEF ||
      user.role === Role.RIDER ||
      user.role === Role.CASHIER)
  ) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
    const resetUrl = `${clientAppUrl()}/reset-password?token=${token}`;
    void sendPasswordResetEmail(user.email, user.name, resetUrl);
  }

  res.json({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
});

authRouter.post("/reset-password", authLimiter, async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token?.trim() || !password) {
    return res.status(400).json({ error: "Token and new password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token.trim(),
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) {
    return res.status(400).json({ error: "Reset link is invalid or has expired." });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  res.json({ ok: true, message: "Password updated. You can sign in now." });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.isActive) return res.status(403).json({ error: "This account is disabled." });
  res.json(publicUser(user));
});

authRouter.post("/2fa/setup", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.totpEnabled) {
    return res.status(400).json({ error: "Authenticator is already enabled. Disable it first to reset." });
  }
  const secret = generateSecret();
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } });
  const settings = await getStoreSettings();
  const otpauth = generateURI({ issuer: storeNameFrom(settings), label: user.email, secret });
  const qrDataUrl = await QRCode.toDataURL(otpauth, { width: 220, margin: 1 });
  res.json({ secret, otpauth, qrDataUrl });
});

authRouter.post("/2fa/enable", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { code } = req.body as { code?: string };
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.totpSecret) return res.status(400).json({ error: "Set up authenticator first." });
  if (!verifyTotp(user.totpSecret, String(code || ""))) {
    return res.status(400).json({ error: "Invalid authenticator code." });
  }
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  res.json({ ok: true, totpEnabled: true });
});

authRouter.post("/2fa/disable", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { code, password } = req.body as { code?: string; password?: string };
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.totpEnabled && user.totpSecret) {
    if (!verifyTotp(user.totpSecret, String(code || ""))) {
      return res.status(400).json({ error: "Invalid authenticator code." });
    }
  } else if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(400).json({ error: "Password required to disable 2FA." });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  res.json({ ok: true, totpEnabled: false });
});
