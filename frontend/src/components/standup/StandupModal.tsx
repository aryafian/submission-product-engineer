'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { useStandupSummary } from '@/hooks/useProjects';

interface StandupModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function StandupModal({ open, onClose, projectId }: StandupModalProps) {
  const { data: summary, isLoading, error } = useStandupSummary(projectId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-2 text-gray-900">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <DialogTitle>Daily Standup Summary</DialogTitle>
        </div>
      </DialogHeader>

      <DialogBody>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Synthesizing immutable audit events...
          </div>
        ) : error || !summary ? (
          <div className="py-6 text-center text-sm text-gray-400">
            No activity summary available for the selected period.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Meta summary strip */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
              <div>
                <span className="font-semibold text-gray-900">{summary.project?.name}</span>
                <p className="text-gray-400 text-xs">Date: {summary.date}</p>
              </div>
              <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-md">
                {summary.totalChanges || 0} Audit Events
              </span>
            </div>

            {/* Department Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Departmental Progress
              </h4>

              {Object.keys(summary.departmentActivities || {}).length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">No departmental activity logged yesterday.</p>
              ) : (
                Object.entries(summary.departmentActivities).map(([dept, activities]: [string, any]) => {
                  const completed = activities.filter(
                    (a: any) => a.action === 'STATUS_CHANGE' && a.newValue === 'DONE'
                  );
                  const blocked = activities.filter(
                    (a: any) => a.action === 'STATUS_CHANGE' && a.newValue === 'BLOCKED'
                  );

                  return (
                    <div
                      key={dept}
                      className="p-3.5 rounded-lg border border-gray-200 bg-white space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-gray-900">
                          {dept.replace('_', '/')} Team
                        </span>
                        <span className="text-xs text-gray-400">
                          {activities.length} updates
                        </span>
                      </div>

                      {/* Completed yesterday */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Completed Yesterday ({completed.length})</span>
                        </div>
                        {completed.length > 0 ? (
                          <ul className="text-xs text-gray-600 space-y-0.5 pl-4 list-disc">
                            {completed.map((c: any, i: number) => (
                              <li key={i} className="truncate">
                                <span className="font-medium text-gray-900">{c.task}</span> by {c.user}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400 italic pl-4">None completed yesterday</p>
                        )}
                      </div>

                      {/* Blocked today */}
                      <div className="space-y-1 pt-1.5 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <Lock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Blocked Today ({blocked.length})</span>
                        </div>
                        {blocked.length > 0 ? (
                          <ul className="text-xs text-gray-600 space-y-0.5 pl-4 list-disc">
                            {blocked.map((b: any, i: number) => (
                              <li key={i} className="truncate">
                                <span className="font-medium text-gray-900">{b.task}</span> (waiting on prerequisites)
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400 italic pl-4">No tasks blocked</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
