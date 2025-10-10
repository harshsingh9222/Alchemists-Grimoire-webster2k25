
  import { createSlice } from '@reduxjs/toolkit';

  const initialState = {
    adherence: { data: null, loading: false, error: null },
    wellness: { data: null, loading: false, error: null },
    upcoming: { data: null, loading: false, error: null },
    statistics: { data: null, loading: false, error: null },
    effectiveness: { data: null, loading: false, error: null },
    insights: { data: null, loading: false, error: null },
    lastFetched: null,
  };

  const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
      setDashboardData(state, action) {
        const { adherence, wellness, upcoming, insights, effectiveness } = action.payload || {};

        if (adherence) {
          state.adherence.data = adherence;
          state.adherence.loading = false;
          state.adherence.error = null;
        }

        if (wellness) {
          state.wellness.data = wellness;
          state.wellness.loading = false;
          state.wellness.error = null;
        }

        if (upcoming) {
          state.upcoming.data = upcoming;
          state.upcoming.loading = false;
          state.upcoming.error = null;
        }

        if (insights) {
          state.insights.data = insights;
          state.insights.loading = false;
          state.insights.error = null;
        }

        if (effectiveness) {
          state.effectiveness.data = effectiveness;
          state.effectiveness.loading = false;
          state.effectiveness.error = null;
        }

        state.lastFetched = new Date().toISOString();
      },

      setDashboardLoading(state, action) {
        const { section, loading } = action.payload;
        if (state[section]) state[section].loading = loading;
      },

      setDashboardError(state, action) {
        const { section, error } = action.payload;
        if (state[section]) {
          state[section].error = error;
          state[section].loading = false;
        }
      },

      clearDashboardData(state) {
        Object.keys(initialState).forEach((k) => {
          state[k] = initialState[k];
        });
      },

      updateAdherenceData(state, action) {
        state.adherence.data = action.payload;
        state.adherence.loading = false;
        state.adherence.error = null;
      },

      updateWellnessData(state, action) {
        state.wellness.data = action.payload;
        state.wellness.loading = false;
        state.wellness.error = null;
      },

      updateUpcomingDoses(state, action) {
        state.upcoming.data = action.payload;
        state.upcoming.loading = false;
        state.upcoming.error = null;
      },

      updateEffectiveness(state, action) {
        state.effectiveness.data = action.payload;
        state.effectiveness.loading = false;
        state.effectiveness.error = null;
      },

      updateStatistics(state, action) {
        state.statistics.data = action.payload;
        state.statistics.loading = false;
        state.statistics.error = null;
      },

      updateInsights(state, action) {
        state.insights.data = action.payload;
        state.insights.loading = false;
        state.insights.error = null;
      },
    },
  });

  export const {
    setDashboardData,
    setDashboardLoading,
    setDashboardError,
    clearDashboardData,
    updateAdherenceData,
    updateWellnessData,
    updateUpcomingDoses,
    updateEffectiveness,
    updateStatistics,
    updateInsights,
  } = dashboardSlice.actions;

  export default dashboardSlice.reducer;

  // Selectors
  export const selectDashboardData = (state) => state.dashboard;
  export const selectAdherenceData = (state) => state.dashboard.adherence;
  export const selectWellnessData = (state) => state.dashboard.wellness;
  export const selectUpcomingDoses = (state) => state.dashboard.upcoming;
  export const selectEffectiveness = (state) => state.dashboard.effectiveness;
  export const selectInsights = (state) => state.dashboard.insights;
  export const selectStatistics = (state) => state.dashboard.statistics;
  export const selectDashboardLoading = (state) =>
    Object.values(state.dashboard).some((section) => typeof section === 'object' && section?.loading === true);
  export const selectLastFetched = (state) => state.dashboard.lastFetched;
  export const selectIsDashboardEmpty = (state) => {
    return !state.dashboard.adherence.data &&
           !state.dashboard.wellness.data &&
           !state.dashboard.upcoming.data &&
           !state.dashboard.insights.data &&
           !state.dashboard.effectiveness.data;}