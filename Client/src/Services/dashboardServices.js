// client/src/services/dashboardService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const dashboardService = {
  getAdherenceData: async (timeRange = 'week') => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/adherence`, {
      params: { timeRange },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getWellnessScore: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/wellness`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getUpcomingDoses: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/upcoming-doses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getInsights: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/insights`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};