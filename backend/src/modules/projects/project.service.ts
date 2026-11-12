import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError, ForbiddenError } from "../../utils/errors";
import { type PaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function listProjects(
  user: any,
  params: PaginationParams
) {
  const where: any = { deletedAt: null };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  // PM sees all, Internal sees assigned, Client sees assigned
  if (user.role !== "PM") {
    where.members = {
      some: {
        userId: user.id,
        deletedAt: null,
      },
    };
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { [params.sortBy]: params.sortOrder },
      include: {
        members: {
          where: { deletedAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, department: true, avatar: true },
            },
          },
        },
        _count: {
          select: { tasks: { where: { deletedAt: null } } },
        },
      },
    }),
  ]);

  // For client: mask member details
  const data = projects.map((p) => {
    if (user.role === "CLIENT_GUEST") {
      const { members, ...rest } = p;
      return rest;
    }
    return p;
  });

  return { data, meta: buildPaginationMeta(total, params.page, params.limit) };
}

export async function getProject(projectId: string, user: any) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: {
      members: {
        where: { deletedAt: null },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, department: true, avatar: true },
          },
        },
      },
      tasks: {
        where: { deletedAt: null },
      },
    },
  });

  if (!project) throw new NotFoundError("Project");

  // Check access
  if (user.role !== "PM") {
    const isMember = project.members.some((m) => m.userId === user.id);
    if (!isMember) throw new ForbiddenError("Not a member of this project");
  }

  // Client gets aggregate metrics
  if (user.role === "CLIENT_GUEST") {
    const visibleTasks = project.tasks.filter((t) => t.clientVisible);
    const totalTasks = visibleTasks.length;
    const completedTasks = visibleTasks.filter((t) => t.status === "DONE").length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      metrics: { totalTasks, completedTasks, completionPercentage },
    };
  }

  const { tasks, ...projectData } = project;
  return projectData;
}

export async function createProject(data: { name: string; description?: string; status?: string }) {
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status || "ACTIVE",
    },
  });
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string; status?: string }
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) throw new NotFoundError("Project");

  return prisma.project.update({
    where: { id: projectId },
    data,
  });
}

export async function deleteProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) throw new NotFoundError("Project");

  return prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: string = "MEMBER"
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) throw new NotFoundError("Project");

  const existing = await prisma.projectMember.findFirst({
    where: { projectId, userId, deletedAt: null },
  });
  if (existing) throw new AppError(409, "User is already a member");

  return prisma.projectMember.create({
    data: { projectId, userId, role },
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId, deletedAt: null },
  });
  if (!member) throw new NotFoundError("Project member");

  return prisma.projectMember.update({
    where: { id: member.id },
    data: { deletedAt: new Date() },
  });
}
