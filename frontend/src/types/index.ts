// ─── Enums ───────────────────────────────────────────────
export type UserRole = 'PM' | 'INTERNAL_TEAM' | 'CLIENT_GUEST';
export type Department = 'UI_UX' | 'FRONTEND' | 'BACKEND' | null;
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

// ─── Models ──────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  tasks?: Task[];
  _count?: {
    tasks: number;
    members: number;
  };
  metrics?: ProjectMetrics;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  user?: User;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  department: Department;
  clientVisible: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  creator?: User;
  project?: Project;
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  comments?: Comment[];
  attachments?: Attachment[];
  auditLogs?: TaskAuditLog[];
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  prerequisiteTaskId: string;
  dependentTask?: Task;
  prerequisiteTask?: Task;
  createdAt: string;
}

export interface TaskAuditLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user?: User;
  task?: Task;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  taskId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

// ─── API Types ───────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: Department;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  department?: Department;
  clientVisible?: boolean;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  department?: Department;
  clientVisible?: boolean;
  version: number;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  version: number;
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionPercentage: number;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  recentActivity: TaskAuditLog[];
}

// ─── Pagination ──────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Filters ─────────────────────────────────────────────
export interface AuditFilters extends PaginationParams {
  projectId?: string;
  taskId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  department?: string;
}

// ─── API Error ───────────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
