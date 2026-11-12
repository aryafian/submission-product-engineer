import { ForbiddenError } from "../../utils/errors";

/**
 * State-Based Permission Rules:
 * - PM: full read/write BUT cannot move IN_PROGRESS → DONE
 * - Internal Team: can only change status and upload attachments, NOT edit description/title
 * - Only assignee can complete a task (move to DONE)
 * - TODO → IN_PROGRESS: only if ALL prerequisites are DONE
 * - CLIENT_GUEST: read-only on clientVisible tasks
 */

export function checkTaskUpdatePermissions(
  user: any,
  task: any,
  updateData: any
) {
  const role = user.role;

  if (role === "CLIENT_GUEST") {
    throw new ForbiddenError("Client guests cannot modify tasks");
  }

  if (role === "INTERNAL_TEAM") {
    // Internal can only change status
    const allowedFields = ["status", "version"];
    const attemptedFields = Object.keys(updateData).filter(
      (k) => updateData[k] !== undefined
    );
    const forbidden = attemptedFields.filter(
      (f) => !allowedFields.includes(f)
    );
    if (forbidden.length > 0) {
      throw new ForbiddenError(
        `Internal team members can only update status. Cannot modify: ${forbidden.join(", ")}`
      );
    }
  }

  // PM cannot move IN_PROGRESS → DONE
  if (
    role === "PM" &&
    updateData.status === "DONE" &&
    task.status === "IN_PROGRESS"
  ) {
    throw new ForbiddenError("PM cannot move task from IN_PROGRESS to DONE");
  }

  // Only assignee can complete a task
  if (updateData.status === "DONE") {
    if (!task.assigneeId || task.assigneeId !== user.id) {
      throw new ForbiddenError("Only the assignee can complete a task");
    }
  }
}

export function checkStatusTransition(
  currentStatus: string,
  newStatus: string,
  prerequisitesAllDone: boolean
): string {
  // If prerequisites are not all done, cannot start or complete the task
  if ((newStatus === "IN_PROGRESS" || newStatus === "DONE") && !prerequisitesAllDone) {
    throw new ForbiddenError(
      "Cannot transition task: unfinished prerequisite tasks must be completed (DONE) first"
    );
  }

  return newStatus;
}
