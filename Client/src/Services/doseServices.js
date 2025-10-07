import { axiosInstance } from '../Utils/axios.helper';

export const doseService = {
  // Fetch doses by date
  getDosesByDate: async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const res = await axiosInstance.get('/doses/by-date', { params: { date: dateStr } });
    // Normalize to an array so callers can safely map
    return res.data?.doses ?? res.data ?? [];
  },

  // Update dose status (e.g., taken, skipped)
  updateDoseStatus: async (data) => {
    const res = await axiosInstance.post('/doses/update', data);
    return res.data;
  },

  // Fetch dose history
  getDoseHistory: async (days = 30) => {
    const res = await axiosInstance.get('/doses/history', { params: { days } });
    return res.data;
  },

  // Wellness tracking
  updateWellness: async (data) => {
    const res = await axiosInstance.post('/wellness/update', data);
    return res.data;
  },

  getWellnessHistory: async (days = 30) => {
    const res = await axiosInstance.get('/wellness/history', { params: { days } });
    return res.data;
  },

  getTodayWellness: async () => {
    const res = await axiosInstance.get('/wellness/today');
    return res.data;
  },

  // Medicines
  getMedicines: async () => {
    // backend uses /medicines/fetchMedicines for list
    const res = await axiosInstance.get('/medicines/fetchMedicines');
    return res.data?.medicines ?? res.data ?? [];
  },

  addMedicine: async (data) => {
    const res = await axiosInstance.post('/medicines/addMedicines', data);
    return res.data;
  },
};