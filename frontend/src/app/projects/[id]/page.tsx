'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuthStore } from '@/stores/authStore';
import { useProject } from '@/hooks/useProjects';
import { useTasks, useUpdateTaskStatus, useUpdateTask, useCreateTask } from '@/hooks/useTasks';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { StandupModal } from '@/components/standup/StandupModal';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ChevronRight } from 'lucide-react';
import type { Task } from '@/types';

function ProjectDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { user, token } = useAuthStore();
  const { data: project, isLoading: projLoading, error: projError } = useProject(projectId);
  const { data: tasksData, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks(projectId);

  const updateStatusMutation = useUpdateTaskStatus(projectId);
  const updateTaskMutation = useUpdateTask(projectId);
  const createTaskMutation = useCreateTask(projectId);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [standupOpen, setStandupOpen] = useState(false);
  const [conflictError, setConflictError] = useState<{ message: string; task: Task } | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    } else if (user?.role === 'CLIENT_GUEST') {
      router.replace(`/client/projects/${projectId}`);
    }
  }, [user, token, projectId, router]);

  if (!user || user.role === 'CLIENT_GUEST') return null;

  const tasks = tasksData?.data || [];

  const handleUpdateStatus = async (task: Task, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        taskId: task.id,
        status: newStatus as any,
        version: task.version,
      });
      refetchTasks();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError({
          message: err.response.data?.error || 'This task was modified by another user.',
          task,
        });
      } else {
        alert(err.response?.data?.error || err.message || 'Status transition failed');
      }
    }
  };

  const handleUpdateTask = async (taskId: string, updateData: any) => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        ...updateData,
      });
      refetchTasks();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError({
          message: err.response.data?.error || 'This task was modified by another user.',
          task: updateData,
        });
      }
      throw err;
    }
  };

  const handleCreateTask = async (taskData: any) => {
    await createTaskMutation.mutateAsync(taskData);
    refetchTasks();
  };

  if (projLoading || tasksLoading) {
    return (
      <SidebarLayout>
        <div className="py-24">
          <LoadingState message="Loading task board..." />
        </div>
      </SidebarLayout>
    );
  }

  if (projError || !project) {
    return (
      <SidebarLayout>
        <div className="py-24">
          <ErrorState message="Project not found." onRetry={() => router.push('/dashboard')} />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="px-8 py-6">
        {/* Breadcrumb + Header — Balance style */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
              <Link href="/dashboard" className="hover:text-gray-700 transition-colors">
                Projects
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-700 font-medium">{project.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h1>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  project.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {project.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{project.members?.length || 0} members</span>
            <span className="text-gray-300">·</span>
            <span>{tasks.length} tasks</span>
          </div>
        </div>

        {/* Task Board */}
        <TaskBoard
          tasks={tasks}
          currentUser={user}
          projectId={projectId}
          onUpdateStatus={handleUpdateStatus}
          onSelectTask={(task) => setSelectedTask(task)}
          onCreateTask={() => setCreateTaskOpen(true)}
          onOpenStandup={() => setStandupOpen(true)}
          onRefresh={() => refetchTasks()}
          isLoading={tasksLoading}
          conflictError={conflictError}
          onClearConflict={() => setConflictError(null)}
        />
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          currentUser={user}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onRefreshTasks={() => refetchTasks()}
          allProjectTasks={tasks}
          projectMembers={project?.members || []}
        />
      )}

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onCreateTask={handleCreateTask}
        projectMembers={project?.members || []}
      />

      <StandupModal
        open={standupOpen}
        onClose={() => setStandupOpen(false)}
        projectId={projectId}
      />
    </SidebarLayout>
  );
}

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-sm text-gray-400">Loading...</div>}>
      <ProjectDetailsContent />
    </Suspense>
  );
}
