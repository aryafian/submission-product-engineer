import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError, ForbiddenError } from "../../utils/errors";
import { type PaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { checkTaskUpdatePermissions, checkStatusTransition } from "./task.permissions";
import { areAllPrerequisitesDone, reevaluateDependents, wouldCreateCycle } from "./task.dependencies";
import { BadRequestError } from "../../utils/errors";

function maskTaskForClient(task: any) {
  const { assignee, creator, comments, auditLogs, ...rest } = task;
  return rest;
}

function formatTask(task: any) {
  if (!task) return task;
  return {
    ...task,
    dependencies: task.dependentOn || task.dependencies || [],
    dependents: task.prerequisiteFor || task.dependents || [],
  };
}

export async function listTasks(
  projectId: string,
  user: any,
  params: PaginationParams
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) throw new NotFoundError("Project");

  // Check membership for non-PM
  if (user.role !== "PM") {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id, deletedAt: null },
    });
    if (!membership) throw new ForbiddenError("Not a member of this project");
  }

  const where: any = { projectId, deletedAt: null };

  // Client only sees clientVisible tasks
  if (user.role === "CLIENT_GUEST") {
    where.clientVisible = true;
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { [params.sortBy]: params.sortOrder },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, department: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, email: true, department: true, avatar: true },
        },
        dependentOn: {
          where: { deletedAt: null },
          include: {
            prerequisiteTask: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        _count: {
          select: {
            comments: { where: { deletedAt: null } },
            attachments: { where: { deletedAt: null } },
          },
        },
      },
    }),
  ]);

  let data = tasks.map(formatTask);
  if (user.role === "CLIENT_GUEST") {
    data = data.map(maskTaskForClient);
  }

  // Add aggregate metrics for client
  let metrics;
  if (user.role === "CLIENT_GUEST") {
    const allVisibleTasks = await prisma.task.count({
      where: { projectId, deletedAt: null, clientVisible: true },
    });
    const completedVisible = await prisma.task.count({
      where: { projectId, deletedAt: null, clientVisible: true, status: "DONE" },
    });
    metrics = {
      totalTasks: allVisibleTasks,
      completedTasks: completedVisible,
      completionPercentage: allVisibleTasks > 0 ? Math.round((completedVisible / allVisibleTasks) * 100) : 0,
    };
  }

  return {
    data,
    meta: buildPaginationMeta(total, params.page, params.limit),
    ...(metrics ? { metrics } : {}),
  };
}

export async function getTask(taskId: string, user: any) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, department: true, avatar: true },
      },
      creator: {
        select: { id: true, name: true, email: true, department: true, avatar: true },
      },
      dependentOn: {
        where: { deletedAt: null },
        include: {
          prerequisiteTask: {
            select: { id: true, title: true, status: true },
          },
        },
      },
      prerequisiteFor: {
        where: { deletedAt: null },
        include: {
          dependentTask: {
            select: { id: true, title: true, status: true },
          },
        },
      },
      comments: {
        where: { deletedAt: null },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        where: { deletedAt: null },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!task) throw new NotFoundError("Task");

  // Check membership
  if (user.role !== "PM") {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: user.id, deletedAt: null },
    });
    if (!membership) throw new ForbiddenError("Not a member of this project");
  }

  // Client: only clientVisible tasks, masked data
  const formatted = formatTask(task);
  if (user.role === "CLIENT_GUEST") {
    if (!task.clientVisible) throw new NotFoundError("Task");
    return maskTaskForClient(formatted);
  }

  return formatted;
}

export async function createTask(
  projectId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    department?: string | null;
    clientVisible?: boolean;
  }
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) throw new NotFoundError("Project");

  const [task] = await prisma.$transaction([
    prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        projectId,
        assigneeId: data.assigneeId,
        creatorId: userId,
        department: data.department,
        clientVisible: data.clientVisible ?? false,
      },
    }),
  ]);

  // Create audit log for creation
  await prisma.taskAuditLog.create({
    data: {
      taskId: task.id,
      userId,
      action: "CREATE",
      field: "task",
      newValue: JSON.stringify({ title: task.title, status: task.status }),
    },
  });

  return task;
}

export async function updateTask(
  taskId: string,
  user: any,
  data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    department?: string | null;
    clientVisible?: boolean;
    version: number;
  }
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new NotFoundError("Task");

  // Optimistic locking
  if (task.version !== data.version) {
    throw new ConflictError(
      `Version conflict: expected ${data.version}, current is ${task.version}. Please refresh and try again.`
    );
  }

  // Check permissions
  checkTaskUpdatePermissions(user, task, data);

  // Handle status transition
  let finalStatus = data.status;
  if (data.status && data.status !== task.status) {
    const allPrereqsDone = await areAllPrerequisitesDone(taskId);
    finalStatus = checkStatusTransition(task.status, data.status, allPrereqsDone);
  }

  // Build audit log entries
  const auditEntries: any[] = [];
  const fieldsToTrack = ["title", "description", "status", "priority", "assigneeId", "department", "clientVisible"];

  for (const field of fieldsToTrack) {
    const newVal = field === "status" ? finalStatus : (data as any)[field];
    if (newVal !== undefined && String(newVal) !== String((task as any)[field])) {
      auditEntries.push({
        taskId,
        userId: user.id,
        action: field === "status" ? "STATUS_CHANGE" : "UPDATE",
        field,
        oldValue: String((task as any)[field]),
        newValue: String(newVal),
      });
    }
  }

  const updateData: any = { version: { increment: 1 } };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (finalStatus !== undefined) updateData.status = finalStatus;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.clientVisible !== undefined) updateData.clientVisible = data.clientVisible;

  const operations: any[] = [
    prisma.task.update({
      where: { id: taskId },
      data: updateData,
    }),
  ];

  if (auditEntries.length > 0) {
    operations.push(
      ...auditEntries.map((entry) => prisma.taskAuditLog.create({ data: entry }))
    );
  }

  const [updatedTask] = await prisma.$transaction(operations);

  // Re-evaluate dependents if status changed
  if (finalStatus && finalStatus !== task.status) {
    await reevaluateDependents(taskId, user.id);
  }

  return updatedTask;
}

export async function updateTaskStatus(
  taskId: string,
  user: any,
  data: { status: string; version: number }
) {
  return updateTask(taskId, user, { status: data.status, version: data.version });
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new NotFoundError("Task");

  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    }),
    prisma.taskAuditLog.create({
      data: {
        taskId,
        userId,
        action: "DELETE",
        field: "task",
        oldValue: JSON.stringify({ title: task.title, status: task.status }),
      },
    }),
  ]);

  // Re-evaluate dependents since this prerequisite is gone
  await reevaluateDependents(taskId, userId);

  return updatedTask;
}

export async function addDependency(
  taskId: string,
  prerequisiteTaskId: string,
  userId: string
) {
  const [task, prereq] = await Promise.all([
    prisma.task.findFirst({ where: { id: taskId, deletedAt: null } }),
    prisma.task.findFirst({ where: { id: prerequisiteTaskId, deletedAt: null } }),
  ]);
  if (!task) throw new NotFoundError("Task");
  if (!prereq) throw new NotFoundError("Prerequisite task");

  if (task.projectId !== prereq.projectId) {
    throw new BadRequestError("Tasks must be in the same project");
  }

  if (taskId === prerequisiteTaskId) {
    throw new BadRequestError("A task cannot depend on itself");
  }

  // Check for existing
  const existing = await prisma.taskDependency.findFirst({
    where: { dependentTaskId: taskId, prerequisiteTaskId, deletedAt: null },
  });
  if (existing) throw new ConflictError("Dependency already exists");

  // Circular dependency detection
  const wouldCycle = await wouldCreateCycle(taskId, prerequisiteTaskId);
  if (wouldCycle) {
    throw new BadRequestError("Adding this dependency would create a circular dependency");
  }

  const dep = await prisma.taskDependency.create({
    data: { dependentTaskId: taskId, prerequisiteTaskId },
  });

  // Re-evaluate the dependent task
  const allDone = await areAllPrerequisitesDone(taskId);
  if (!allDone && (task.status === "TODO" || task.status === "IN_PROGRESS")) {
    await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { status: "BLOCKED", version: { increment: 1 } },
      }),
      prisma.taskAuditLog.create({
        data: {
          taskId,
          userId,
          action: "STATUS_CHANGE",
          field: "status",
          oldValue: task.status,
          newValue: "BLOCKED",
        },
      }),
    ]);
  }

  return dep;
}

export async function removeDependency(taskId: string, depId: string, userId: string) {
  const dep = await prisma.taskDependency.findFirst({
    where: { id: depId, dependentTaskId: taskId, deletedAt: null },
  });
  if (!dep) throw new NotFoundError("Dependency");

  await prisma.taskDependency.update({
    where: { id: depId },
    data: { deletedAt: new Date() },
  });

  // Re-evaluate the dependent task
  const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (task && task.status === "BLOCKED") {
    const allDone = await areAllPrerequisitesDone(taskId);
    if (allDone) {
      await prisma.$transaction([
        prisma.task.update({
          where: { id: taskId },
          data: { status: "TODO", version: { increment: 1 } },
        }),
        prisma.taskAuditLog.create({
          data: {
            taskId,
            userId,
            action: "STATUS_CHANGE",
            field: "status",
            oldValue: "BLOCKED",
            newValue: "TODO",
          },
        }),
      ]);
    }
  }

  return { message: "Dependency removed" };
}

export async function getStandupSummary(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) throw new NotFoundError("Project");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const auditLogs = await prisma.taskAuditLog.findMany({
    where: {
      task: { projectId, deletedAt: null },
      createdAt: { gte: yesterday, lt: today },
    },
    include: {
      task: { select: { id: true, title: true, department: true } },
      user: { select: { id: true, name: true, department: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by department
  const byDepartment: Record<string, any[]> = {};
  for (const log of auditLogs) {
    const dept = log.task.department || log.user.department || "UNASSIGNED";
    if (!byDepartment[dept]) byDepartment[dept] = [];
    byDepartment[dept].push({
      action: log.action,
      field: log.field,
      oldValue: log.oldValue,
      newValue: log.newValue,
      task: log.task.title,
      user: log.user.name,
      time: log.createdAt,
    });
  }

  // Task summary
  const tasks = await prisma.task.findMany({
    where: { projectId, deletedAt: null },
    select: { status: true },
  });
  const statusCounts = tasks.reduce(
    (acc: Record<string, number>, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return {
    date: yesterday.toISOString().split("T")[0],
    project: { id: project.id, name: project.name },
    taskStatusSummary: statusCounts,
    departmentActivities: byDepartment,
    totalChanges: auditLogs.length,
  };
}
