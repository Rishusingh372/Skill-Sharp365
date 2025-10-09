import api from '../config/axios';

export const uploadService = {
  // Upload course thumbnail
  uploadCourseThumbnail: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/course-thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update course thumbnail
  updateCourseThumbnail: async (courseId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.put(`/upload/course-thumbnail/${courseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};