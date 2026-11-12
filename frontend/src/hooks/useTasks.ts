import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  PaginatedResponse,
} from '@/types';

export function useTasks(projectId: string, params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Task> & { metrics?: any }>(
        `/projects/${projectId}/tasks`,
        { params }
      );
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await api.get<{ data: Task }>(`/tasks/${taskId}`);
      return res.data.data;
    },
    enabled: !!taskId,
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTaskRequest) => {
      const res = await api.post<{ data: Task }>(`/projects/${projectId}/tasks`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...data }: UpdateTaskRequest & { taskId: string }) => {
      const res = await api.put<{ data: Task }>(`/tasks/${taskId}`, data);
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
  });
}

export function useUpdateTaskStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...data }: UpdateTaskStatusRequest & { taskId: string }) => {
      const res = await api.patch<{ data: Task }>(`/tasks/${taskId}/status`, data);
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
  });
}

export function useAddDependency(taskId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prerequisiteTaskId: string) => {
      const res = await api.post(`/tasks/${taskId}/dependencies`, { prerequisiteTaskId });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useRemoveDependency(taskId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (depId: string) => {
      const res = await api.delete(`/tasks/${taskId}/dependencies/${depId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/tasks/${taskId}/comments`, { content });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

export function useAddAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachment: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }) => {
      const res = await api.post(`/tasks/${taskId}/attachments`, attachment);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}
