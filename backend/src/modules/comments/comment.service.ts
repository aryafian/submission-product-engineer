import { prisma } from "../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../utils/errors";
import { type PaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function listComments(
  taskId: string,
  user: any,
  params: PaginationParams
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new NotFoundError("Task");

  // Client: only visible tasks, no internal comments
  if (user.role === "CLIENT_GUEST") {
    if (!task.clientVisible) throw new NotFoundError("Task");
  }

  const where: any = { taskId, deletedAt: null };
  if (params.search) {
    where.content = { contains: params.search };
  }

  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { [params.sortBy]: params.sortOrder },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    }),
  ]);

  let data: any = comments;
  // Client: internal comment history must be completely filtered out at API level
  if (user.role === "CLIENT_GUEST") {
    data = comments.filter((c: any) => c.user.role === "CLIENT_GUEST").map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      taskId: c.taskId,
      user: { id: c.user.id }
    }));
  }

  return { data, meta: buildPaginationMeta(total, params.page, params.limit) };
}

export async function createComment(taskId: string, userId: string, content: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new NotFoundError("Task");

  return prisma.comment.create({
    data: { content, taskId, userId },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });
}

export async function updateComment(commentId: string, userId: string, content: string) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
  });
  if (!comment) throw new NotFoundError("Comment");
  if (comment.userId !== userId) throw new ForbiddenError("Can only edit own comments");

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });
}

export async function deleteComment(commentId: string, userId: string, userRole: string) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
  });
  if (!comment) throw new NotFoundError("Comment");
  if (comment.userId !== userId && userRole !== "PM") {
    throw new ForbiddenError("Can only delete own comments");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
}
