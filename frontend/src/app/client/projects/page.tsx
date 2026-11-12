'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuthStore } from '@/stores/authStore';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Shield, ArrowRight, FolderKanban } from 'lucide-react';

export default function ClientProjectsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { data: projectsData, isLoading, error } = useProjects();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  const projects = projectsData?.data || [];

  return (
    <SidebarLayout>
      <div className="px-8 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-gray-900">Deliverables Portfolio</h1>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <Shield className="h-3 w-3" />
                Client Access
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Track published milestone progress and sign-off status in real time
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading your projects..." />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects assigned"
            description="You do not have access to any active client projects currently."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {project.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {project._count?.tasks || 0} Deliverables
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <Link href={`/client/projects/${project.id}`}>
                    <Button variant="outline" size="sm" className="w-full justify-between">
                      <span>View Deliverables Progress</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
