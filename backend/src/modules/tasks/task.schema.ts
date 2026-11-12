import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().optional(),
  department: z.enum(["UI_UX", "FRONTEND", "BACKEND"]).nullable().optional(),
  clientVisible: z.boolean().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  department: z.enum(["UI_UX", "FRONTEND", "BACKEND"]).nullable().optional(),
  clientVisible: z.boolean().optional(),
  version: z.number().int(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]),
  version: z.number().int(),
});

export const addDependencySchema = z.object({
  prerequisiteTaskId: z.string().min(1),
});
