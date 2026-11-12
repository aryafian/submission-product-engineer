'use client';

import React from 'react';
import type { Project, Task } from '@/types';
import {
  CheckCircle2,
  Clock,
  Shield,
  Calendar,
} from 'lucide-react';

interface ClientViewProps {
  project: Project;
  tasks: Task[];
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
}

export function ClientView({ project, tasks, metrics }: ClientViewProps) {
  const total = metrics?.totalTasks ?? tasks.length;
  const completed = metrics?.completedTasks ?? tasks.filter((t) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const percentage = metrics?.completionPercentage ?? (total > 0 ? Math.round((completed / total) * 100) : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left 2 Columns: Sections styled like Balance "Client Information", "Invoice Details", "Items" */}
      <div className="lg:col-span-2 space-y-6">
        {/* Section 1: Project Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Project Information</h2>
              <p className="text-xs text-gray-500 mt-0.5">Isolated Client Deliverables View</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Shield className="h-3.5 w-3.5" />
              Verified Tenant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Project Name</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-medium">
                {project.name}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {project.status}
              </div>
            </div>
            {project.description && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Scope & Objectives</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-xs leading-relaxed">
                  {project.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Deliverable Items (styled like Balance "Items" table) */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Deliverables</h2>
              <p className="text-xs text-gray-500 mt-0.5">Approved milestone outputs published for review</p>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {tasks.length} item{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No client-visible deliverables published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isDone = task.status === 'DONE';
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isDone ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="text-xs text-gray-400">
                          v{task.version}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: "Summary Amount" Style Milestone Card */}
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100">
            Summary Overview
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-gray-600">
              <span>Total Deliverables</span>
              <span className="font-medium text-gray-900">{total}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Completed</span>
              <span className="font-medium text-emerald-600">{completed}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>In Progress</span>
              <span className="font-medium text-blue-600">{inProgress}</span>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Milestone Progress</span>
              <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-2">
              <div
                className="bg-[#6366F1] h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
