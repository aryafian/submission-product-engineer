'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import type { TaskPriority, Department, ProjectMember } from '@/types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreateTask: (taskData: any) => Promise<any>;
  projectMembers?: any[];
}

export function CreateTaskModal({ open, onClose, onCreateTask, projectMembers = [] }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [department, setDepartment] = useState<Department>('FRONTEND');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [clientVisible, setClientVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter internal team members eligible for assignment
  const eligibleAssignees = projectMembers
    .map((m) => m.user)
    .filter((u) => u && u.role !== 'CLIENT_GUEST');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        department,
        assigneeId: assigneeId || undefined,
        clientVisible,
      });
      setTitle('');
      setDescription('');
      setAssigneeId('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>New Deliverable</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogBody>
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Slicing UI Checkout Screen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description & Specifications
              </label>
              <textarea
                rows={3}
                placeholder="Describe acceptance criteria and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Department
                </label>
                <select
                  value={department || ''}
                  onChange={(e) => setDepartment((e.target.value as Department) || null)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
                >
                  <option value="UI_UX">UI/UX Design</option>
                  <option value="FRONTEND">Frontend</option>
                  <option value="BACKEND">Backend</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Assignee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Assignee (Executor)
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
              >
                <option value="">Unassigned</option>
                {eligibleAssignees.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'PM' ? 'PM' : u.department?.replace('_', '/') || u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientVisible}
                  onChange={(e) => setClientVisible(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-xs">Flag as Client-Visible (Client Portal)</span>
              </label>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Deliverable'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
