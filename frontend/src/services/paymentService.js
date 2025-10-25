import api from '../config/axios';

export const paymentService = {
  // Create checkout session
  createCheckoutSession: async (courseId) => {
    const response = await api.post('/payment/create-checkout-session', { courseId });
    return response.data;
  },

  // Verify payment
  verifyPayment: async (sessionId) => {
    const response = await api.post('/payment/verify', { sessionId });
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async () => {
    const response = await api.get('/payment/history');
    return response.data;
  },

  // Get instructor earnings
  getInstructorEarnings: async () => {
    const response = await api.get('/payment/instructor/earnings');
    return response.data;
  }
};