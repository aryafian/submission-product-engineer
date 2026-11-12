import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { getPaginationParams } from "../../utils/pagination";
import { AppError } from "../../utils/errors";
import { listComments, createComment, updateComment, deleteComment } from "./comment.service";
import type { AppEnv } from "../../types/env";

const commentRoutes = new Hono<AppEnv>();

commentRoutes.use("*", authMiddleware);

// GET /api/tasks/:taskId/comments
commentRoutes.get("/tasks/:taskId/comments", async (c) => {
  const user = c.get("user");
  const params = getPaginationParams(c);
  try {
    const result = await listComments(c.req.param("taskId")!, user, params);
    return c.json(result);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// POST /api/tasks/:taskId/comments
commentRoutes.post("/tasks/:taskId/comments", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  if (!body.content) return c.json({ error: "Content is required" }, 400);
  try {
    const comment = await createComment(c.req.param("taskId")!, user.id, body.content);
    return c.json({ data: comment }, 201);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// PUT /api/comments/:id
commentRoutes.put("/comments/:id", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  if (!body.content) return c.json({ error: "Content is required" }, 400);
  try {
    const comment = await updateComment(c.req.param("id")!, user.id, body.content);
    return c.json({ data: comment });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// DELETE /api/comments/:id
commentRoutes.delete("/comments/:id", async (c) => {
  const user = c.get("user");
  try {
    await deleteComment(c.req.param("id")!, user.id, user.role);
    return c.json({ message: "Comment deleted" });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

export default commentRoutes;
