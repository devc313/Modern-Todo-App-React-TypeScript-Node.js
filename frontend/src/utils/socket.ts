import { io, Socket } from 'socket.io-client';
import { useAuthStore, useTodoStore } from '@/store';
import { Todo, Comment } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Join user's personal room
      const user = useAuthStore.getState().user;
      if (user) {
        this.joinUserRoom(user.id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    // Todo events
    this.socket.on('todo-created', (todo: Todo) => {
      console.log('Todo created:', todo);
      // Handle todo creation in store
      const { addTodo } = useTodoStore.getState();
      addTodo(todo);
    });

    this.socket.on('todo-updated', (todo: Todo) => {
      console.log('Todo updated:', todo);
      // Handle todo update in store
      const { updateTodo } = useTodoStore.getState();
      updateTodo(todo.id, todo);
    });

    this.socket.on('todo-deleted', (todoId: string) => {
      console.log('Todo deleted:', todoId);
      // Handle todo deletion in store
      const { removeTodo } = useTodoStore.getState();
      removeTodo(todoId);
    });

    // Comment events
    this.socket.on('comment-added', (comment: Comment) => {
      console.log('Comment added:', comment);
      // Handle comment addition
      // You might want to update the specific todo with the new comment
    });

    // User events
    this.socket.on('user-joined', (userId: string) => {
      console.log('User joined:', userId);
    });

    this.socket.on('user-left', (userId: string) => {
      console.log('User left:', userId);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Room management
  joinUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-user-room', userId);
    }
  }

  joinTeamRoom(teamId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-team-room', teamId);
    }
  }

  leaveTeamRoom(teamId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-team-room', teamId);
    }
  }

  // Todo events
  emitTodoCreated(todo: Todo): void {
    if (this.socket?.connected) {
      this.socket.emit('todo-created', todo);
    }
  }

  emitTodoUpdated(todo: Todo): void {
    if (this.socket?.connected) {
      this.socket.emit('todo-updated', todo);
    }
  }

  emitTodoDeleted(todoId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('todo-deleted', todoId);
    }
  }

  // Comment events
  emitCommentAdded(comment: Comment): void {
    if (this.socket?.connected) {
      this.socket.emit('comment-added', comment);
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Export for use in components
export default socketService;
