import api from './api';

export const userService = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  // Add new user
  add: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Toggle user status
  toggleStatus: async (id) => {
    const response = await api.put(`/api/users/${id}/status`);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },
};

export const logService = {
  // Get all logs
  getAll: async (limit = 100) => {
    const response = await api.get(`/api/logs?limit=${limit}`);
    return response.data;
  },

  // Clear all logs
  clearAll: async () => {
    const response = await api.delete('/api/logs');
    return response.data;
  },
};

export default {
  users: userService,
  logs: logService,
};
