import { prisma } from "../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../utils/errors";
import { type PaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function listAttachments(
  taskId: string,
  user: any,
  params: PaginationParams
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new NotFoundError("Task");

  if (user.role === "CLIENT_GUEST" && !task.clientVisible) {
    throw new NotFoundError("Task");
  }

  const where: any = { taskId, deletedAt: null };
  if (params.search) {
    where.fileName = { contains: params.search };
  }

  const [total, attachments] = await Promise.all([
    prisma.attachment.count({ where }),
    prisma.attachment.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { [params.sortBy]: params.sortOrder },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  let data = attachments;
  if (user.role === "CLIENT_GUEST") {
    data = attachments.map((a: any) => ({ ...a, user: undefined }));
  }

  return { data, meta: buildPaginationMeta(total, params.page, params.limit) };
}

export async function createAttachment(
  taskId: string,
  userId: string,
  data: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new NotFoundError("Task");

  return prisma.attachment.create({
    data: {
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      taskId,
      userId,
    },
  });
}

export async function deleteAttachment(attachmentId: string, userId: string, userRole: string) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, deletedAt: null },
  });
  if (!attachment) throw new NotFoundError("Attachment");
  if (attachment.userId !== userId && userRole !== "PM") {
    throw new ForbiddenError("Can only delete own attachments");
  }

  return prisma.attachment.update({
    where: { id: attachmentId },
    data: { deletedAt: new Date() },
  });
}
