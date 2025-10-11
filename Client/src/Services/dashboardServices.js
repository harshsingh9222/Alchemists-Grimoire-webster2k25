// client/src/services/dashboardService.js
import { axiosInstance } from '../Utils/axios.helper';

export const dashboardService = {
  getAdherenceData: async (timeRange = 'week') => {
    try {
      const response = await axiosInstance.get('/dashboard/adherence', {
        params: { timeRange }
      });
      return response.data?.data || response.data; // Handle both ApiResponse format and direct data
    } catch (error) {
      console.error('Error fetching adherence data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch adherence data');
    }
  },

  getWellnessScore: async (timeRange = 'week') => {
    try {
      const response = await axiosInstance.get('/dashboard/wellness', {
        params: { timeRange }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching wellness data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch wellness score');
    }
  },

  getUpcomingDoses: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/upcoming-doses');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching upcoming doses:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch upcoming doses');
    }
  },

  getInsights: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/insights');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch insights');
    }
  },

  // Additional utility methods
  recordDose: async (doseData) => {
    try {
      const response = await axiosInstance.post('/dashboard/record-dose', doseData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error recording dose:', error);
      throw new Error(error.response?.data?.message || 'Failed to record dose');
    }
  },

  getStatistics: async (timeRange = 'week') => {
    try {
      const response = await axiosInstance.get('/dashboard/statistics', {
        params: { timeRange }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  },

  getPotionEffectiveness: async (timeRange = 'week') => {
    try {
      const response = await axiosInstance.get('/dashboard/potion-effectiveness', {
        params: { timeRange }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching potion effectiveness:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch potion effectiveness');
    }
  }
};