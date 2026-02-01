import axios from 'axios';
import { Team } from '../types';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const teamService = {
  // Get all teams
  getAllTeams: async () => {
    const response = await axios.get(`${API_URL}/teams`, getAuthHeaders());
    return response.data;
  },

  // Create new team
  createTeam: async (teamData: { name: string; description?: string }) => {
    const response = await axios.post(`${API_URL}/teams`, teamData, getAuthHeaders());
    return response.data;
  },

  // Update team
  updateTeam: async (id: string, teamData: { name?: string; description?: string }) => {
    const response = await axios.put(`${API_URL}/teams/${id}`, teamData, getAuthHeaders());
    return response.data;
  },

  // Delete team
  deleteTeam: async (id: string) => {
    const response = await axios.delete(`${API_URL}/teams/${id}`, getAuthHeaders());
    return response.data;
  },

  // Add users to team
  addMembersToTeam: async (teamId: string, userIds: string[]) => {
    const response = await axios.post(
      `${API_URL}/teams/${teamId}/members`,
      { userIds },
      getAuthHeaders()
    );
    return response.data;
  },

  // Remove user from team
  removeMemberFromTeam: async (teamId: string, userId: string) => {
    const response = await axios.delete(
      `${API_URL}/teams/${teamId}/members/${userId}`,
      getAuthHeaders()
    );
    return response.data;
  }
};
