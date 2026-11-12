import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/projects/project.routes";
import taskRoutes from "./modules/tasks/task.routes";
import commentRoutes from "./modules/comments/comment.routes";
import attachmentRoutes from "./modules/attachments/attachment.routes";
import { AppError } from "./utils/errors";

const app = new Hono();

// Middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use("*", logger());

// Health check
app.get("/", (c) => c.json({ message: "NodeWave API is running", version: "1.0.0" }));
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api", taskRoutes);
app.route("/api", commentRoutes);
app.route("/api", attachmentRoutes);

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.statusCode as any);
  }
  return c.json({ error: "Internal Server Error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

const port = parseInt(process.env.PORT || "3001", 10);

console.log(`🚀 Server starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
