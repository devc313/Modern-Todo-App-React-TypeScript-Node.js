import React, { useEffect } from 'react';
import { Plus, CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { useTodoStore, useAuthStore } from '@/store';
import { todoApi, userApi } from '@/utils/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodoCard from '@/components/TodoCard';
import CreateTodoModal from '@/components/CreateTodoModal';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { todos, isLoading, setTodos, setLoading } = useTodoStore();
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  useEffect(() => {
    loadTodos();
    loadUserStats();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const response = await todoApi.getTodos({ limit: 10 });
      setTodos(response.todos);
    } catch (error: any) {
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      await userApi.getStats();
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusCount = (status: string) => {
    return todos.filter(todo => todo.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Circle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Todos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatusCount('COMPLETED')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatusCount('IN_PROGRESS')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Circle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatusCount('TODO')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent todos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Todos</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Todo
            </button>
          </div>
        </div>

        <div className="p-6">
          {todos.length === 0 ? (
            <div className="text-center py-12">
              <Circle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No todos yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first todo.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Todo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {todos.slice(0, 5).map((todo) => (
                <TodoCard key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Todo Modal */}
      {showCreateModal && (
        <CreateTodoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTodos();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
