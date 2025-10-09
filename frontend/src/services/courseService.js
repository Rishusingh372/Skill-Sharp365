import api from '../config/axios';

export const courseService = {
  // Get all courses
  getAllCourses: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/courses?${params.toString()}`);
    return response.data;
  },

  // Get featured courses
  getFeaturedCourses: async () => {
    const response = await api.get('/courses/featured');
    return response.data;
  },

  // Get single course
  getCourseById: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  // Create new course
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  // Update course
  updateCourse: async (courseId, courseData) => {
    const response = await api.put(`/courses/${courseId}`, courseData);
    return response.data;
  },

  // Get instructor courses
  getInstructorCourses: async () => {
    const response = await api.get('/courses/instructor/my-courses');
    return response.data;
  },

  // Publish/unpublish course
  togglePublishCourse: async (courseId) => {
    const response = await api.patch(`/courses/${courseId}/publish`);
    return response.data;
  },

  // Delete course
  deleteCourse: async (courseId) => {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
  }
};