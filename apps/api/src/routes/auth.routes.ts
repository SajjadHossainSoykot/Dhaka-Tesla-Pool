import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createAccessToken, hashPassword, verifyPassword } from "../lib/auth.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

const LoginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

function publicUser(user: { id: string; name: string; email: string; role: "PASSENGER" | "DRIVER" }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

router.post("/register", async (req, res) => {
  const input = RegisterSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "Email is already registered", "EMAIL_EXISTS");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: "PASSENGER",
    },
  });

  const token = createAccessToken({ sub: user.id, role: user.role, email: user.email });
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const input = LoginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = createAccessToken({ sub: user.id, role: user.role, email: user.email });
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  res.json({ user: publicUser(user) });
});

export default router;
