import { prisma } from "../../lib/prisma";
import { BadRequestError } from "../../utils/errors";

/**
 * Detect circular dependencies using DFS.
 * Returns true if adding a dependency from dependentTaskId → prerequisiteTaskId would create a cycle.
 */
export async function wouldCreateCycle(
  dependentTaskId: string,
  prerequisiteTaskId: string
): Promise<boolean> {
  // If adding prerequisiteTaskId as a prereq of dependentTaskId,
  // check if dependentTaskId is reachable from prerequisiteTaskId
  // (meaning prerequisiteTaskId already depends on dependentTaskId)
  const visited = new Set<string>();

  async function dfs(taskId: string): Promise<boolean> {
    if (taskId === dependentTaskId) return true;
    if (visited.has(taskId)) return false;
    visited.add(taskId);

    const deps = await prisma.taskDependency.findMany({
      where: { dependentTaskId: taskId, deletedAt: null },
      select: { prerequisiteTaskId: true },
    });

    for (const dep of deps) {
      if (await dfs(dep.prerequisiteTaskId)) return true;
    }
    return false;
  }

  return dfs(prerequisiteTaskId);
}

/**
 * Check if all prerequisites of a task are DONE
 */
export async function areAllPrerequisitesDone(taskId: string): Promise<boolean> {
  const deps = await prisma.taskDependency.findMany({
    where: { dependentTaskId: taskId, deletedAt: null },
    include: {
      prerequisiteTask: { select: { status: true, deletedAt: true } },
    },
  });

  if (deps.length === 0) return true;

  return deps.every(
    (d) => d.prerequisiteTask.deletedAt === null && d.prerequisiteTask.status === "DONE"
  );
}

/**
 * Re-evaluate dependent tasks when a prerequisite changes status.
 * If prereq is no longer DONE, block dependents that were TODO/IN_PROGRESS.
 * If prereq becomes DONE, unblock dependents whose ALL prereqs are now DONE.
 */
export async function reevaluateDependents(
  prerequisiteTaskId: string,
  userId: string
): Promise<void> {
  const dependents = await prisma.taskDependency.findMany({
    where: { prerequisiteTaskId, deletedAt: null },
    include: {
      dependentTask: { select: { id: true, status: true, version: true, deletedAt: true } },
    },
  });

  for (const dep of dependents) {
    if (dep.dependentTask.deletedAt) continue;

    const allDone = await areAllPrerequisitesDone(dep.dependentTask.id);

    if (!allDone && (dep.dependentTask.status === "TODO" || dep.dependentTask.status === "IN_PROGRESS")) {
      await prisma.$transaction([
        prisma.task.update({
          where: { id: dep.dependentTask.id },
          data: { status: "BLOCKED", version: { increment: 1 } },
        }),
        prisma.taskAuditLog.create({
          data: {
            taskId: dep.dependentTask.id,
            userId,
            action: "STATUS_CHANGE",
            field: "status",
            oldValue: dep.dependentTask.status,
            newValue: "BLOCKED",
          },
        }),
      ]);
    } else if (allDone && dep.dependentTask.status === "BLOCKED") {
      await prisma.$transaction([
        prisma.task.update({
          where: { id: dep.dependentTask.id },
          data: { status: "TODO", version: { increment: 1 } },
        }),
        prisma.taskAuditLog.create({
          data: {
            taskId: dep.dependentTask.id,
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
}
