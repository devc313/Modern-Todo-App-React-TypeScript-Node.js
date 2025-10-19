import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store';
import { ApiResponse, LoginData, RegisterData, AuthResponse, Todo, Category, CreateTodoData, UpdateTodoData, CreateCategoryData, UpdateCategoryData, UserStats } from '@/types';

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const api = createApiClient();

// Auth API
export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/login', data);
    return response.data.data!;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/register', data);
    return response.data.data!;
  },

  getMe: async (): Promise<{ user: any }> => {
    const response: AxiosResponse<ApiResponse<{ user: any }>> = await api.get('/auth/me');
    return response.data.data!;
  },

  updateProfile: async (data: Partial<{ name: string; avatar: string }>): Promise<{ user: any }> => {
    const response: AxiosResponse<ApiResponse<{ user: any }>> = await api.put('/auth/profile', data);
    return response.data.data!;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/auth/password', data);
  },
};

// Todo API
export const todoApi = {
  getTodos: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<{ todos: Todo[]; pagination: any }> => {
    const response: AxiosResponse<ApiResponse<{ todos: Todo[]; pagination: any }>> = await api.get('/todos', { params });
    return response.data.data!;
  },

  getTodo: async (id: string): Promise<Todo> => {
    const response: AxiosResponse<ApiResponse<Todo>> = await api.get(`/todos/${id}`);
    return response.data.data!;
  },

  createTodo: async (data: CreateTodoData): Promise<Todo> => {
    const response: AxiosResponse<ApiResponse<Todo>> = await api.post('/todos', data);
    return response.data.data!;
  },

  updateTodo: async (id: string, data: UpdateTodoData): Promise<Todo> => {
    const response: AxiosResponse<ApiResponse<Todo>> = await api.put(`/todos/${id}`, data);
    return response.data.data!;
  },

  deleteTodo: async (id: string): Promise<void> => {
    await api.delete(`/todos/${id}`);
  },
};

// Category API
export const categoryApi = {
  getCategories: async (): Promise<{ categories: Category[] }> => {
    const response: AxiosResponse<ApiResponse<{ categories: Category[] }>> = await api.get('/categories');
    return response.data.data!;
  },

  getCategory: async (id: string): Promise<Category> => {
    const response: AxiosResponse<ApiResponse<Category>> = await api.get(`/categories/${id}`);
    return response.data.data!;
  },

  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    const response: AxiosResponse<ApiResponse<Category>> = await api.post('/categories', data);
    return response.data.data!;
  },

  updateCategory: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    const response: AxiosResponse<ApiResponse<Category>> = await api.put(`/categories/${id}`, data);
    return response.data.data!;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// User API
export const userApi = {
  getStats: async (): Promise<UserStats> => {
    const response: AxiosResponse<ApiResponse<UserStats>> = await api.get('/users/stats');
    return response.data.data!;
  },

  getTeams: async (): Promise<{ teams: any[] }> => {
    const response: AxiosResponse<ApiResponse<{ teams: any[] }>> = await api.get('/users/teams');
    return response.data.data!;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/account');
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string; uptime: number; environment: string }> => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}/health`);
    return response.data;
  },
};

export default api;
