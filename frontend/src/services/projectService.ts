import api from './api';

export const projectService = {
  getAllProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  createProject: async (projectData: { name: string; description?: string }) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  }
};
