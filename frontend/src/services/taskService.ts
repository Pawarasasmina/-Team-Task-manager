import api from './api';
import { Task } from '../types';

export const taskService = {
  getAllTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  getAllTasksAdmin: async () => {
    const response = await api.get('/tasks/admin/all');
    return response.data;
  },

  createTask: async (taskData: { title: string; description?: string }) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (taskId: string, taskData: { title?: string; description?: string }) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  updateTaskStatus: async (taskId: string, status: 'todo' | 'doing' | 'done') => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  assignTask: async (taskData: { title: string; description?: string; userId: string; priority?: string }) => {
    const response = await api.post('/tasks/assign', taskData);
    return response.data;
  },

  assignTaskToTeam: async (taskData: { title: string; description?: string; userIds: string[]; teamId: string; priority?: string }) => {
    const response = await api.post('/tasks/assign-team', {
      title: taskData.title,
      description: taskData.description,
      userIds: taskData.userIds,
      priority: taskData.priority
    });
    return response.data;
  },

  getAnalytics: async (params?: { period?: string; userId?: string; teamId?: string }) => {
    const response = await api.get('/tasks/analytics', { params });
    return response.data;
  },
};
