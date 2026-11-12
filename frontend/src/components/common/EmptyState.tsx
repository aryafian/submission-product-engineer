'use client';

import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-gray-200 bg-white">
      <div className="rounded-full bg-gray-50 p-3.5 border border-gray-100">
        <FolderOpen className="h-6 w-6 text-gray-400" />
      </div>
      <div className="text-center max-w-sm">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 mt-1 leading-normal">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
