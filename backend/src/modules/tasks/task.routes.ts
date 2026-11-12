import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { getPaginationParams } from "../../utils/pagination";
import { AppError } from "../../utils/errors";
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, addDependencySchema } from "./task.schema";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addDependency,
  removeDependency,
  getStandupSummary,
} from "./task.service";
import type { AppEnv } from "../../types/env";

const taskRoutes = new Hono<AppEnv>();

taskRoutes.use("*", authMiddleware);

// GET /api/projects/:projectId/tasks
taskRoutes.get("/projects/:projectId/tasks", async (c) => {
  const user = c.get("user");
  const params = getPaginationParams(c);
  try {
    const result = await listTasks(c.req.param("projectId")!, user, params);
    return c.json(result);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// GET /api/projects/:projectId/standup
taskRoutes.get("/projects/:projectId/standup", async (c) => {
  try {
    const result = await getStandupSummary(c.req.param("projectId")!);
    return c.json({ data: result });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// GET /api/tasks/:id
taskRoutes.get("/tasks/:id", async (c) => {
  const user = c.get("user");
  try {
    const result = await getTask(c.req.param("id")!, user);
    return c.json({ data: result });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// POST /api/projects/:projectId/tasks (PM only)
taskRoutes.post("/projects/:projectId/tasks", requireRole("PM"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  try {
    const task = await createTask(c.req.param("projectId")!, user.id, parsed.data);
    return c.json({ data: task }, 201);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// PUT /api/tasks/:id (optimistic locking)
taskRoutes.put("/tasks/:id", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  try {
    const task = await updateTask(c.req.param("id")!, user, parsed.data);
    return c.json({ data: task });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// PATCH /api/tasks/:id/status
taskRoutes.patch("/tasks/:id/status", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = updateTaskStatusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  try {
    const task = await updateTaskStatus(c.req.param("id")!, user, parsed.data);
    return c.json({ data: task });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// DELETE /api/tasks/:id (PM only)
taskRoutes.delete("/tasks/:id", requireRole("PM"), async (c) => {
  const user = c.get("user");
  try {
    await deleteTask(c.req.param("id")!, user.id);
    return c.json({ message: "Task deleted" });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// POST /api/tasks/:id/dependencies (PM only)
taskRoutes.post("/tasks/:id/dependencies", requireRole("PM"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = addDependencySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  try {
    const dep = await addDependency(c.req.param("id")!, parsed.data.prerequisiteTaskId, user.id);
    return c.json({ data: dep }, 201);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// DELETE /api/tasks/:id/dependencies/:depId (PM only)
taskRoutes.delete("/tasks/:id/dependencies/:depId", requireRole("PM"), async (c) => {
  const user = c.get("user");
  try {
    const result = await removeDependency(c.req.param("id")!, c.req.param("depId")!, user.id);
    return c.json(result);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

export default taskRoutes;
