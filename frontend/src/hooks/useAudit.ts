import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { TaskAuditLog, AuditFilters, PaginatedResponse } from '@/types';

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.taskId) params.set('taskId', filters.taskId);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get<PaginatedResponse<TaskAuditLog>>(
        `/audit?${params.toString()}`
      );
      return res.data;
    },
  });
}

export function useTaskAuditLogs(taskId: string) {
  return useQuery({
    queryKey: ['task-audit-logs', taskId],
    queryFn: async () => {
      const res = await api.get<TaskAuditLog[]>(`/tasks/${taskId}/audit`);
      return res.data;
    },
    enabled: !!taskId,
  });
}
