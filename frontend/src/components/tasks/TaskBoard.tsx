'use client';

import React, { useState } from 'react';
import type { Task, User } from '@/types';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  CircleDashed,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

interface TaskBoardProps {
  tasks: Task[];
  currentUser: User | null;
  projectId: string;
  onUpdateStatus: (task: Task, newStatus: string) => Promise<any>;
  onSelectTask: (task: Task) => void;
  onCreateTask: () => void;
  onOpenStandup: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  conflictError?: { message: string; task: Task } | null;
  onClearConflict: () => void;
}

export function TaskBoard({
  tasks,
  currentUser,
  projectId,
  onUpdateStatus,
  onSelectTask,
  onCreateTask,
  onOpenStandup,
  onRefresh,
  isLoading,
  conflictError,
  onClearConflict,
}: TaskBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const isPM = currentUser?.role === 'PM';

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === 'ALL' || t.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const columns: {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'TODO',
      title: 'To Do',
      icon: <CircleDashed className="h-4 w-4 text-gray-400" />,
      color: 'border-t-gray-300',
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      color: 'border-t-blue-400',
    },
    {
      id: 'DONE',
      title: 'Done',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      color: 'border-t-emerald-400',
    },
    {
      id: 'BLOCKED',
      title: 'Blocked',
      icon: <Lock className="h-4 w-4 text-amber-500" />,
      color: 'border-t-amber-400',
    },
  ];

  const handleStatusChange = async (task: Task, newStatus: string) => {
    setUpdatingTaskId(task.id);
    try {
      await onUpdateStatus(task, newStatus);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Conflict Dialog */}
      <Dialog open={!!conflictError} onOpenChange={() => onClearConflict()}>
        <DialogHeader onClose={onClearConflict}>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Conflict Detected (409)</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <p className="font-medium mb-1">This task was modified by another user.</p>
            <p className="text-red-600 text-xs">
              {conflictError?.message || 'Version mismatch detected.'}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Refresh the data to get the latest version and try again.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClearConflict}>
            Dismiss
          </Button>
          <Button
            onClick={() => {
              onClearConflict();
              onRefresh();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Toolbar — Balance style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
            {['ALL', 'UI_UX', 'FRONTEND', 'BACKEND'].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedDept === dept
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {dept === 'ALL' ? 'All' : dept.replace('_', '/')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onOpenStandup}>
            <Sparkles className="h-4 w-4 text-emerald-500" />
            Standup
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {isPM && (
            <Button size="sm" onClick={onCreateTask}>
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => {
            const rawDeps = t.dependencies || (t as any).dependentOn || [];
            const hasIncomplete = rawDeps
              .map((d: any) => d.prerequisiteTask)
              .some((pt: any) => pt && pt.status !== 'DONE');
            const isTaskBlocked = (t.status === 'BLOCKED' || hasIncomplete) && t.status !== 'DONE';

            if (col.id === 'BLOCKED') {
              return isTaskBlocked;
            }
            if (isTaskBlocked) {
              return false;
            }
            return t.status === col.id;
          });

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl bg-gray-50 border border-gray-200 p-3 min-h-[480px] border-t-2 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 py-2 mb-2">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <span className="text-sm font-medium text-gray-700">{col.title}</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-md font-medium">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2.5 flex-1">
                {colTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onSelectTask={onSelectTask}
                      onStatusChange={handleStatusChange}
                      isChangingStatus={updatingTaskId === task.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
