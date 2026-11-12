import type { Context, Next } from "hono";
import { verifyToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import type { AppEnv } from "../types/env";

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
    });
    if (!user) {
      return c.json({ error: "Unauthorized: User not found" }, 401);
    }
    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
}
