'use client';

import React, { useState } from 'react';
import type { Task, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Lock,
  Eye,
  MessageSquare,
  Paperclip,
  History,
  Trash2,
  Plus,
  Send,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  useTask,
  useAddComment,
  useAddAttachment,
  useAddDependency,
  useRemoveDependency,
} from '@/hooks/useTasks';

interface TaskModalProps {
  task: Task | null;
  currentUser: User | null;
  onClose: () => void;
  onUpdateTask: (taskId: string, updateData: any) => Promise<any>;
  onRefreshTasks: () => void;
  allProjectTasks: Task[];
  projectMembers?: any[];
}

export function TaskModal({
  task: initialTask,
  currentUser,
  onClose,
  onUpdateTask,
  onRefreshTasks,
  allProjectTasks,
  projectMembers = [],
}: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'dependencies' | 'comments' | 'attachments' | 'audit'>('details');
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState(initialTask?.priority || 'MEDIUM');
  const [clientVisible, setClientVisible] = useState(initialTask?.clientVisible || false);
  const [department, setDepartment] = useState(initialTask?.department || 'FRONTEND');
  const [assigneeId, setAssigneeId] = useState(initialTask?.assigneeId || '');
  const [selectedPrereqId, setSelectedPrereqId] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const eligibleAssignees = projectMembers
    .map((m) => m.user)
    .filter((u) => u && u.role !== 'CLIENT_GUEST');

  const { data: detailedTask, refetch } = useTask(initialTask?.id || '');
  const task = detailedTask || initialTask;

  const isPM = currentUser?.role === 'PM';
  const isInternal = currentUser?.role === 'INTERNAL_TEAM';
  const isAssignee = currentUser?.id === task?.assigneeId;

  const addCommentMutation = useAddComment(task?.id || '');
  const addAttachmentMutation = useAddAttachment(task?.id || '');
  const addDepMutation = useAddDependency(task?.id || '', task?.projectId || '');
  const removeDepMutation = useRemoveDependency(task?.id || '', task?.projectId || '');

  if (!task) return null;

  const handleSaveDetails = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onUpdateTask(task.id, {
        title,
        description,
        priority,
        department,
        assigneeId: assigneeId || null,
        clientVisible,
        version: task.version,
      });
      await refetch();
      onRefreshTasks();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedPrereqId) return;
    setErrorMsg(null);
    try {
      await addDepMutation.mutateAsync(selectedPrereqId);
      setSelectedPrereqId('');
      await refetch();
      onRefreshTasks();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Circular dependency detected');
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    setErrorMsg(null);
    try {
      await removeDepMutation.mutateAsync(depId);
      await refetch();
      onRefreshTasks();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to remove');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addCommentMutation.mutateAsync(newComment.trim());
      setNewComment('');
      await refetch();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to post comment');
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
    try {
      await addAttachmentMutation.mutateAsync({
        fileName: newAttachmentName.trim(),
        fileUrl: newAttachmentUrl.trim(),
        fileSize: 1024 * 100,
        mimeType: 'application/octet-stream',
      });
      setNewAttachmentName('');
      setNewAttachmentUrl('');
      await refetch();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to add attachment');
    }
  };

  const taskDeps = task.dependencies || (task as any).dependentOn || [];
  const existingDepIds = new Set(taskDeps.map((d: any) => d.prerequisiteTaskId));
  const candidatePrereqs = allProjectTasks.filter(
    (t) => t.id !== task.id && !existingDepIds.has(t.id)
  );

  const statusColors: Record<string, string> = {
    DONE: 'bg-emerald-50 text-emerald-700',
    BLOCKED: 'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    TODO: 'bg-gray-100 text-gray-700',
  };

  const selectClass = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">Task Details</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[task.status] || statusColors.TODO}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400">v{task.version}</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-gray-100 px-6 gap-1 overflow-x-auto">
            {[
              { id: 'details', label: 'Overview' },
              { id: 'dependencies', label: `Dependencies (${taskDeps.length})` },
              { id: 'comments', label: `Comments (${task.comments?.length || 0})` },
              { id: 'attachments', label: `Files (${task.attachments?.length || 0})` },
              { id: 'audit', label: 'Audit Trail' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Task Information — Balance section style */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Task Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                      {isPM ? (
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                      ) : (
                        <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                          {task.title}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                      {isPM ? (
                        <textarea
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
                        />
                      ) : (
                        <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200 min-h-[80px]">
                          {task.description || <span className="text-gray-400 italic">No description</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Details — Key-value pairs like Balance summary */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Assignee</span>
                      {isPM ? (
                        <select
                          value={assigneeId || ''}
                          onChange={(e) => setAssigneeId(e.target.value)}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm focus:bg-white"
                        >
                          <option value="">Unassigned</option>
                          {eligibleAssignees.map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role === 'PM' ? 'PM' : u.department?.replace('_', '/') || u.role})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {task.assignee?.name || 'Unassigned'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Department</span>
                      {isPM ? (
                        <select
                          value={department || ''}
                          onChange={(e) => setDepartment((e.target.value as any) || null)}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
                        >
                          <option value="UI_UX">UI/UX Design</option>
                          <option value="FRONTEND">Frontend</option>
                          <option value="BACKEND">Backend</option>
                        </select>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{task.department || '—'}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Priority</span>
                      {isPM ? (
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{task.priority}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Client Visible</span>
                      {isPM ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={clientVisible}
                            onChange={(e) => setClientVisible(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            {clientVisible ? 'Published' : 'Hidden'}
                          </span>
                        </label>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {task.clientVisible ? 'Published' : 'Internal Only'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isPM && (
                  <Button onClick={handleSaveDetails} disabled={isSaving} className="w-full">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            )}

            {/* DEPENDENCIES TAB */}
            {activeTab === 'dependencies' && (
              <div className="space-y-5">
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-sm text-indigo-800">
                  Tasks are automatically blocked until all prerequisites are completed.
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">
                    Prerequisites ({taskDeps.length})
                  </h4>

                  {taskDeps.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-3">
                      No dependencies. This task can start immediately.
                    </p>
                  ) : (
                    taskDeps.map((dep: any) => {
                      const prereq = dep.prerequisiteTask;
                      const isDone = prereq?.status === 'DONE';
                      return (
                        <div
                          key={dep.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {prereq?.title || 'Unknown'}
                              </p>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {prereq?.status || 'UNKNOWN'}
                              </span>
                            </div>
                          </div>

                          {isPM && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDependency(dep.id)}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {isPM && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Add Prerequisite</h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedPrereqId}
                        onChange={(e) => setSelectedPrereqId(e.target.value)}
                        className={selectClass + ' flex-1'}
                      >
                        <option value="">Select a task...</option>
                        {candidatePrereqs.map((cp) => (
                          <option key={cp.id} value={cp.id}>
                            {cp.title} ({cp.status})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={handleAddDependency}
                        disabled={!selectedPrereqId || addDepMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                        Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(task.comments || []).length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-6 text-center">
                      No comments yet.
                    </p>
                  ) : (
                    (task.comments || []).map((c: any) => (
                      <div key={c.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-900">{c.user?.name || 'User'}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-gray-100">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}

            {/* ATTACHMENTS TAB */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {(task.attachments || []).length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-6 text-center">
                      No files attached.
                    </p>
                  ) : (
                    (task.attachments || []).map((att: any) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium text-gray-900 truncate">{att.fileName}</p>
                            <p className="text-xs text-gray-400 truncate">{att.fileUrl}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {(isPM || isInternal) && (
                  <form onSubmit={handleAddAttachment} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Upload Attachment</p>
                    <Input
                      placeholder="File name (e.g. design-spec.pdf)"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                    />
                    <Input
                      placeholder="File URL"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    />
                    <Button type="submit" variant="outline" className="w-full">
                      <Upload className="h-4 w-4" />
                      Attach File
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* AUDIT TRAIL TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
                  Immutable audit trail — every field change is logged.
                </div>

                <div className="relative pl-5 border-l-2 border-gray-200 space-y-4">
                  {(task.auditLogs || []).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No audit entries.</p>
                  ) : (
                    (task.auditLogs || []).map((log: any) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white" />

                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {log.user?.name || 'System'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-500">{log.field}</span>
                        </div>

                        {(log.oldValue !== null || log.newValue !== null) && (
                          <div className="mt-1.5 text-xs bg-gray-50 border border-gray-200 p-2 rounded-lg flex items-center gap-2 truncate">
                            {log.oldValue && (
                              <span className="line-through text-red-500 truncate">{log.oldValue}</span>
                            )}
                            {log.oldValue && log.newValue && <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />}
                            {log.newValue && (
                              <span className="font-medium text-emerald-600 truncate">{log.newValue}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              ID: {task.id.slice(0, 8)}...
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
