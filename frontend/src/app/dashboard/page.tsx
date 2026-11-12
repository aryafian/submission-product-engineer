'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useAuthStore } from '@/stores/authStore';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Users,
  ArrowRight,
  FolderKanban,
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { data: projectsData, isLoading, error, refetch } = useProjects();
  const createProjectMutation = useCreateProject();

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    } else if (user?.role === 'CLIENT_GUEST') {
      router.replace('/client/projects');
    }
  }, [user, token, router]);

  if (!user || user.role === 'CLIENT_GUEST') {
    return null;
  }

  const isPM = user.role === 'PM';
  const projects = projectsData?.data || [];
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreateError(null);
    try {
      await createProjectMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      setCreateOpen(false);
      refetch();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create project');
    }
  };

  return (
    <SidebarLayout>
      <div className="px-8 py-6 max-w-6xl">
        {/* Page Header — Balance style */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your project deliverables and task boards
            </p>
          </div>

          {isPM && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <LoadingState message="Loading projects..." />
        ) : error ? (
          <ErrorState message="Could not load projects." onRetry={() => refetch()} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description={
              isPM
                ? "Create your first project to get started."
                : "No projects are assigned to you yet."
            }
            action={
              isPM ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      project.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {project._count?.tasks || 0} tasks
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{project.members?.length || 0} members</span>
                  </div>

                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm">
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader onClose={() => setCreateOpen(false)}>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateProject}>
          <DialogBody>
            {createError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {createError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Name
                </label>
                <Input
                  placeholder="e.g. Core Banking API 2.0"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the project goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </SidebarLayout>
  );
}
