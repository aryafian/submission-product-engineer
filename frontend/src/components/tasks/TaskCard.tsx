'use client';

import React from 'react';
import type { Task, User } from '@/types';
import {
  Lock,
  Eye,
  CheckCircle2,
  Play,
  Check,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  currentUser: User | null;
  onSelectTask: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: string) => void;
  isChangingStatus?: boolean;
}

export function TaskCard({
  task,
  currentUser,
  onSelectTask,
  onStatusChange,
  isChangingStatus,
}: TaskCardProps) {
  const isPM = currentUser?.role === 'PM';
  const isAssignee = currentUser?.id === task.assigneeId;

  const rawDeps = task.dependencies || (task as any).dependentOn || [];
  const unfinishedPrereqs = rawDeps
    .map((d: any) => d.prerequisiteTask)
    .filter((pt: any) => pt && pt.status !== 'DONE');

  const hasUnfinishedPrereqs = unfinishedPrereqs.length > 0;
  const isBlocked = task.status === 'BLOCKED' || hasUnfinishedPrereqs;

  const canStart = !isBlocked && (task.status === 'TODO' || task.status === 'BLOCKED');
  const canComplete = isAssignee && task.status === 'IN_PROGRESS';

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-300',
    MEDIUM: 'bg-blue-400',
    HIGH: 'bg-amber-400',
    URGENT: 'bg-red-400',
    CRITICAL: 'bg-red-600',
  };

  const deptLabels: Record<string, string> = {
    UI_UX: 'UI/UX',
    FRONTEND: 'Frontend',
    BACKEND: 'Backend',
  };

  return (
    <div
      onClick={() => onSelectTask(task)}
      className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-3.5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div>
        {/* Top row: priority + dept + tags */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${priorityColors[task.priority] || 'bg-blue-400'} shrink-0`}
              title={`Priority: ${task.priority}`}
            />
            {task.department && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {deptLabels[task.department] || task.department}
              </span>
            )}
            {task.clientVisible && (
              <span className="flex items-center gap-0.5 text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                <Eye className="h-3 w-3" />
                Client
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">v{task.version}</span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {task.description}
          </p>
        )}

        {/* Blocked banner */}
        {hasUnfinishedPrereqs && (
          <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            <div className="flex items-center gap-1 font-medium mb-0.5">
              <Lock className="h-3 w-3 text-amber-600" />
              <span>Waiting on {unfinishedPrereqs.length} prerequisite{unfinishedPrereqs.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-0.5 text-amber-700 pl-4">
              {unfinishedPrereqs.map((p: any) => (
                <div key={p.id} className="truncate flex items-center justify-between gap-1">
                  <span className="truncate">{p.title}</span>
                  <span className="text-[10px] uppercase px-1 rounded bg-amber-100 text-amber-800 shrink-0">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Assignee */}
        <div className="flex items-center gap-2 min-w-0">
          {task.assignee ? (
            <div className="flex items-center gap-1.5 truncate" title={`Assigned to ${task.assignee.name}`}>
              <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium text-xs shrink-0">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-600 truncate">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
            <button
              type="button"
              disabled={!canStart || isChangingStatus}
              onClick={() => onStatusChange(task, 'IN_PROGRESS')}
              title={hasUnfinishedPrereqs ? 'Blocked by prerequisites' : 'Start Task'}
              className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                canStart
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {hasUnfinishedPrereqs ? (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Start</span>
                </>
              )}
            </button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <button
              type="button"
              disabled={!canComplete || isChangingStatus}
              onClick={() => onStatusChange(task, 'DONE')}
              title={
                !isAssignee
                  ? 'Only the assignee can complete this'
                  : isPM
                  ? 'PM cannot complete tasks'
                  : 'Complete Task'
              }
              className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                canComplete
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check className="h-3 w-3 stroke-[3]" />
              <span>Complete</span>
            </button>
          )}

          {task.status === 'DONE' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
