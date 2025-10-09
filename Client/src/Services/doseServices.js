import { axiosInstance } from '../Utils/axios.helper';

const toLocalDateStr = (input) => {
  const pad = (n) => String(n).padStart(2, '0');

  if (!input) {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  if (input instanceof Date) {
    return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())}`;
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  }

  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const doseService = {
  // Fetch doses by date
  getDosesByDate: async (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const dateStr = `${year}-${month}-${day}`;
    console.log("Fetching doses for date (local):", dateStr);

    const res = await axiosInstance.get('/doses/by-date', { params: { date: dateStr } });
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
    const payload = { ...data };

    if (payload.date) {
      payload.date = toLocalDateStr(payload.date);
    } else {
      payload.date = toLocalDateStr(new Date());
    }

    if (payload.metrics && typeof payload.metrics === 'object') {
      const normalized = {};
      Object.entries(payload.metrics).forEach(([k, v]) => {
        normalized[k] = typeof v === 'number' ? v : Number(v ?? 0);
      });
      payload.metrics = normalized;
    }

    const res = await axiosInstance.post('/wellness/update', payload);
    return res.data;
  },

  getWellnessHistory: async (days = 30) => {
    const res = await axiosInstance.get('/wellness/history', { params: { days } });
    return res.data;
  },

  // <-- patched: unwrap ApiResponse so callers receive the wellness object directly -->
  getTodayWellness: async () => {
    const res = await axiosInstance.get('/wellness/today');
    // ApiResponse shape example: { status: 200, data: { ... }, message: "..." }
    // return the inner .data if present, otherwise fallback
    return res.data?.data ?? res.data ?? null;
  },


  // Medicines
  getMedicines: async () => {
    const res = await axiosInstance.get('/medicines/fetchMedicines');
    return res.data?.medicines ?? res.data ?? [];
  },

  addMedicine: async (data) => {
    const res = await axiosInstance.post('/medicines/addMedicines', data);
    return res.data;
  },
};
