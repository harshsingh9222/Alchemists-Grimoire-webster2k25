// client/src/Store/dashboardSlice.js
import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    adherenceData: [],
    wellnessScore: 0,
    upcomingDoses: [],
    insights: [],
    loading: false,
    error: null
  },
  reducers: {
    clearDashboard: (state) => {
      state.adherenceData = [];
      state.wellnessScore = 0;
      state.upcomingDoses = [];
      state.insights = [];
    },
    setDashboardData: (state, action) => {
      state.adherenceData = action.payload.adherence;
      state.wellnessScore = action.payload.wellness;
      state.upcomingDoses = action.payload.upcoming;
      state.insights = action.payload.insights;
      state.loading = false;
      state.error = null;
    }
  }
});

export const { clearDashboard, setDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;