import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { getPaginationParams } from "../../utils/pagination";
import { AppError } from "../../utils/errors";
import { listAttachments, createAttachment, deleteAttachment } from "./attachment.service";
import type { AppEnv } from "../../types/env";

const attachmentRoutes = new Hono<AppEnv>();

attachmentRoutes.use("*", authMiddleware);

// GET /api/tasks/:taskId/attachments
attachmentRoutes.get("/tasks/:taskId/attachments", async (c) => {
  const user = c.get("user");
  const params = getPaginationParams(c);
  try {
    const result = await listAttachments(c.req.param("taskId")!, user, params);
    return c.json(result);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// POST /api/tasks/:taskId/attachments (PM + Internal)
attachmentRoutes.post(
  "/tasks/:taskId/attachments",
  requireRole("PM", "INTERNAL_TEAM"),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    try {
      const attachment = await createAttachment(c.req.param("taskId")!, user.id, body);
      return c.json({ data: attachment }, 201);
    } catch (err) {
      if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
      throw err;
    }
  }
);

// DELETE /api/attachments/:id
attachmentRoutes.delete("/attachments/:id", async (c) => {
  const user = c.get("user");
  try {
    await deleteAttachment(c.req.param("id")!, user.id, user.role);
    return c.json({ message: "Attachment deleted" });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

export default attachmentRoutes;
