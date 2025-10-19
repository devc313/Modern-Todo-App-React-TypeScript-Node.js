// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}

// Todo types
export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categories: Category[];
  subtasks: Subtask[];
  comments: Comment[];
  completedSubtasks: number;
  totalSubtasks: number;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  categoryIds?: string[];
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  dueDate?: string;
  categoryIds?: string[];
}

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  todoCount?: number;
}

export interface CreateCategoryData {
  name: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
}

// Subtask types
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  todoId: string;
}

export interface CreateSubtaskData {
  title: string;
  order?: number;
}

export interface UpdateSubtaskData {
  title?: string;
  completed?: boolean;
  order?: number;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  todoId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface CreateCommentData {
  content: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  joinedAt: string;
}

export interface TeamMember {
  id: string;
  role: Role;
  joinedAt: string;
  teamId: string;
  userId: string;
}

// Enums
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Auth types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Filter types
export interface TodoFilters {
  page?: number;
  limit?: number;
  status?: Status;
  priority?: Priority;
  category?: string;
  search?: string;
}

// Statistics types
export interface UserStats {
  todoStats: Record<string, number>;
  categoryStats: Array<{
    id: string;
    name: string;
    color: string;
    todoCount: number;
  }>;
  recentTodos: Array<{
    id: string;
    title: string;
    status: Status;
    updatedAt: string;
  }>;
  completionRate: number;
  totalTodos: number;
  completedTodos: number;
}

// Socket events
export interface SocketEvents {
  'todo-created': (todo: Todo) => void;
  'todo-updated': (todo: Todo) => void;
  'todo-deleted': (todoId: string) => void;
  'comment-added': (comment: Comment) => void;
  'user-joined': (userId: string) => void;
  'user-left': (userId: string) => void;
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Theme types
export type Theme = 'light' | 'dark';

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
