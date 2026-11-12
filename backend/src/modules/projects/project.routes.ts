import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { getPaginationParams } from "../../utils/pagination";
import { AppError } from "../../utils/errors";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from "./project.service";
import type { AppEnv } from "../../types/env";

const projectRoutes = new Hono<AppEnv>();

// All routes require auth
projectRoutes.use("*", authMiddleware);

// GET /api/projects
projectRoutes.get("/", async (c) => {
  const user = c.get("user");
  const params = getPaginationParams(c);
  try {
    const result = await listProjects(user, params);
    return c.json(result);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// GET /api/projects/:id
projectRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  try {
    const result = await getProject(c.req.param("id")!, user);
    return c.json({ data: result });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// POST /api/projects (PM only)
projectRoutes.post("/", requireRole("PM"), async (c) => {
  const body = await c.req.json();
  try {
    const project = await createProject(body);
    return c.json({ data: project }, 201);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// PUT /api/projects/:id (PM only)
projectRoutes.put("/:id", requireRole("PM"), async (c) => {
  const body = await c.req.json();
  try {
    const project = await updateProject(c.req.param("id")!, body);
    return c.json({ data: project });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// DELETE /api/projects/:id (PM only)
projectRoutes.delete("/:id", requireRole("PM"), async (c) => {
  try {
    await deleteProject(c.req.param("id")!);
    return c.json({ message: "Project deleted" });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// POST /api/projects/:id/members (PM only)
projectRoutes.post("/:id/members", requireRole("PM"), async (c) => {
  const body = await c.req.json();
  if (!body.userId) return c.json({ error: "userId is required" }, 400);
  try {
    const member = await addProjectMember(c.req.param("id")!, body.userId, body.role);
    return c.json({ data: member }, 201);
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

// DELETE /api/projects/:id/members/:userId (PM only)
projectRoutes.delete("/:id/members/:userId", requireRole("PM"), async (c) => {
  try {
    await removeProjectMember(c.req.param("id")!, c.req.param("userId")!);
    return c.json({ message: "Member removed" });
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any);
    throw err;
  }
});

export default projectRoutes;
