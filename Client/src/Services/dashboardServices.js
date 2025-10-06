// client/src/services/dashboardService.js
import { axiosInstance } from '../Utils/axios.helper';

export const dashboardService = {
  getAdherenceData: async (timeRange = 'week') => {
    const response = await axiosInstance.get('/dashboard/adherence', {
      params: { timeRange }
    });
    return response.data;
  },

  getWellnessScore: async () => {
    const response = await axiosInstance.get('/dashboard/wellness');
    return response.data;
  },

  getUpcomingDoses: async () => {
    const response = await axiosInstance.get('/dashboard/upcoming-doses');
    return response.data;
  },

  getInsights: async () => {
    const response = await axiosInstance.get('/dashboard/insights');
    return response.data;
  }
};