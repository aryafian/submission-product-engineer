'use client';

import React, { useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuthStore } from '@/stores/authStore';
import { useProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { ClientView } from '@/components/client/ClientView';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ChevronRight } from 'lucide-react';

function ClientProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { user, token } = useAuthStore();
  const { data: project, isLoading: projLoading, error: projError } = useProject(projectId);
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useTasks(projectId);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (projLoading || tasksLoading) {
    return (
      <SidebarLayout>
        <div className="py-24">
          <LoadingState message="Loading client portal..." />
        </div>
      </SidebarLayout>
    );
  }

  if (projError || !project) {
    return (
      <SidebarLayout>
        <div className="py-24">
          <ErrorState
            message="Project not found or you lack permission to view this project."
            onRetry={() => router.push('/client/projects')}
          />
        </div>
      </SidebarLayout>
    );
  }

  const tasks = tasksData?.data || [];
  const metrics = (project as any).metrics || (tasksData as any)?.metrics;

  return (
    <SidebarLayout>
      <div className="px-8 py-6 max-w-6xl">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/client/projects" className="hover:text-gray-700 transition-colors">
            Portfolio
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-700 font-medium">{project.name}</span>
        </div>

        <ClientView project={project} tasks={tasks} metrics={metrics} />
      </div>
    </SidebarLayout>
  );
}

export default function ClientProjectDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-sm text-gray-400">Loading client portal...</div>}>
      <ClientProjectDetailContent />
    </Suspense>
  );
}
