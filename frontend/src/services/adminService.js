import api from '../config/axios';

export const adminService = {
  // Get platform statistics
  getPlatformStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get all users with pagination and filters
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Get user details
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get all courses (including unpublished)
  getAllCourses: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/admin/courses?${params.toString()}`);
    return response.data;
  },

  // Approve or reject course
  approveCourse: async (courseId, action, reason = '') => {
    const response = await api.patch(`/admin/courses/${courseId}/approve`, {
      action,
      reason
    });
    return response.data;
  },

  // Delete any course
  deleteCourse: async (courseId) => {
    const response = await api.delete(`/admin/courses/${courseId}`);
    return response.data;
  },

  // Get all payments
  getAllPayments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/admin/payments?${params.toString()}`);
    return response.data;
  },

  // Process refund
  processRefund: async (paymentId, reason = '') => {
    const response = await api.post(`/admin/payments/${paymentId}/refund`, {
      reason
    });
    return response.data;
  }
};