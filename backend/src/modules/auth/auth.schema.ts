import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["PM", "INTERNAL_TEAM", "CLIENT_GUEST"]).optional(),
  department: z.enum(["UI_UX", "FRONTEND", "BACKEND"]).nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
