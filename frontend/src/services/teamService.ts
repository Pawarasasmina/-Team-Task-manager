import api from './api';

export const teamService = {
  // Get all teams
  getAllTeams: async () => {
    const response = await api.get('/teams');
    return response.data;
  },

  // Create new team
  createTeam: async (teamData: { name: string; description?: string }) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  // Update team
  updateTeam: async (id: string, teamData: { name?: string; description?: string }) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  // Delete team
  deleteTeam: async (id: string) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  // Add users to team
  addMembersToTeam: async (teamId: string, userIds: string[]) => {
    const response = await api.post(`/teams/${teamId}/members`, { userIds });
    return response.data;
  },

  // Remove user from team
  removeMemberFromTeam: async (teamId: string, userId: string) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  }
};
