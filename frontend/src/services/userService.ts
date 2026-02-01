import api from './api';
import { User } from '../types';

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  registerUser: async (userData: {
    name: string;
    email: string;
    contactNumber: string;
    password: string;
    team?: string;
  }) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<User>) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Get own profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update own profile
  updateProfile: async (profileData: {
    name?: string;
    contactNumber?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
};
