import { Hono } from "hono";
import { registerSchema, loginSchema } from "./auth.schema";
import { registerUser, loginUser, getMe } from "./auth.service";
import { authMiddleware } from "../../middleware/auth";
import { AppError } from "../../utils/errors";
import type { AppEnv } from "../../types/env";

const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  try {
    const result = await registerUser(parsed.data);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    throw err;
  }
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    return c.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    throw err;
  }
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  try {
    const me = await getMe(user.id);
    return c.json({ data: me });
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    throw err;
  }
});

export default authRoutes;
