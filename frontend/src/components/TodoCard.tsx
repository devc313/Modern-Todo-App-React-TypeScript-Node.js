import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Calendar, Tag } from 'lucide-react';
import { Todo, Priority, Status } from '@/types';

interface TodoCardProps {
  todo: Todo;
  onUpdate?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
}

const TodoCard: React.FC<TodoCardProps> = ({ todo, onUpdate, onDelete }) => {
  const getStatusIcon = (status: Status) => {
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

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && todo.status !== 'COMPLETED';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Status icon */}
          <div className="mt-1">
            {getStatusIcon(todo.status)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {todo.description}
              </p>
            )}

            {/* Meta information */}
            <div className="flex items-center space-x-4 mt-3">
              {/* Priority */}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                {todo.priority}
              </span>

              {/* Status */}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(todo.status)}`}>
                {todo.status.replace('_', ' ')}
              </span>

              {/* Due date */}
              {todo.dueDate && (
                <div className={`flex items-center text-xs ${isOverdue(todo.dueDate) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(todo.dueDate)}
                </div>
              )}

              {/* Subtasks progress */}
              {todo.totalSubtasks > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {todo.completedSubtasks}/{todo.totalSubtasks} subtasks
                </div>
              )}
            </div>

            {/* Categories */}
            {todo.categories.length > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <Tag className="h-3 w-3 text-gray-400" />
                <div className="flex space-x-1">
                  {todo.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Comments count */}
          {todo.comments.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {todo.comments.length} comments
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoCard;
