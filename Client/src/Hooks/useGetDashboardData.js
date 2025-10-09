import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  setDashboardLoading, 
  setDashboardError,
  updateAdherenceData,
  updateWellnessData,
  updateUpcomingDoses,
  updateInsights,
  updateEffectiveness
} from '../Store/dashboardSlice';
import { dashboardService } from '../Services/dashboardServices';

const useGetDashboardData = (options = {}) => {
  const dispatch = useDispatch();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const { 
    refreshInterval = null, // Auto-refresh interval in milliseconds
    timeRange = 'week' // Default time range for adherence data
  } = options;

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
        dispatch(setDashboardLoading({ section: 'adherence', loading: true }));
        dispatch(setDashboardLoading({ section: 'wellness', loading: true }));
        dispatch(setDashboardLoading({ section: 'upcoming', loading: true }));
        dispatch(setDashboardLoading({ section: 'insights', loading: true }));
      }

      // Fetch all dashboard data concurrently
      const results = await Promise.allSettled([
        dashboardService.getAdherenceData(timeRange),
        dashboardService.getWellnessScore(),
        dashboardService.getUpcomingDoses(),
        dashboardService.getInsights(),
        dashboardService.getPotionEffectiveness(timeRange)
      ]);

      const [adherence, wellness, upcoming, insights, effectiveness] = results;

      // Process adherence data
      if (adherence.status === 'fulfilled') {
        dispatch(updateAdherenceData(adherence.value));
      } else {
        dispatch(setDashboardError({ 
          section: 'adherence', 
          error: adherence.reason?.message || 'Failed to fetch adherence data' 
        }));
      }

      // Process wellness data
      if (wellness.status === 'fulfilled') {
        dispatch(updateWellnessData(wellness.value));
      } else {
        dispatch(setDashboardError({ 
          section: 'wellness', 
          error: wellness.reason?.message || 'Failed to fetch wellness data' 
        }));
      }

      // Process upcoming doses
      if (upcoming.status === 'fulfilled') {
        dispatch(updateUpcomingDoses(upcoming.value));
      } else {
        dispatch(setDashboardError({ 
          section: 'upcoming', 
          error: upcoming.reason?.message || 'Failed to fetch upcoming doses' 
        }));
      }

      // Process insights
      if (insights.status === 'fulfilled') {
        dispatch(updateInsights(insights.value));
      } else {
        dispatch(setDashboardError({ 
          section: 'insights', 
          error: insights.reason?.message || 'Failed to fetch insights' 
        }));
      }

      // Process potion effectiveness
      if (effectiveness && effectiveness.status === 'fulfilled') {
        dispatch(updateEffectiveness(effectiveness.value));
      } else if (effectiveness && effectiveness.status === 'rejected') {
        dispatch(setDashboardError({ section: 'effectiveness', error: effectiveness.reason?.message || 'Failed to fetch effectiveness' }));
      }

      setIsInitialLoad(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      
      // Set error for all sections if there's a general failure
      const errorMessage = error.message || 'Failed to fetch dashboard data';
      dispatch(setDashboardError({ section: 'adherence', error: errorMessage }));
      dispatch(setDashboardError({ section: 'wellness', error: errorMessage }));
      dispatch(setDashboardError({ section: 'upcoming', error: errorMessage }));
      dispatch(setDashboardError({ section: 'insights', error: errorMessage }));
      
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();
    
    // Set up auto-refresh if specified
    let intervalId;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchDashboardData(false); // Don't show loading on auto-refresh
      }, refreshInterval);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeRange]); // Re-fetch when timeRange changes

  // Return utility functions for manual refresh
  return {
    refetch: () => fetchDashboardData(),
    refreshAdherence: async () => {
      try {
        dispatch(setDashboardLoading({ section: 'adherence', loading: true }));
        const data = await dashboardService.getAdherenceData(timeRange);
        dispatch(updateAdherenceData(data));
      } catch (error) {
        dispatch(setDashboardError({ 
          section: 'adherence', 
          error: error.message || 'Failed to refresh adherence data' 
        }));
      }
    },
    refreshWellness: async () => {
      try {
        dispatch(setDashboardLoading({ section: 'wellness', loading: true }));
        const data = await dashboardService.getWellnessScore();
        dispatch(updateWellnessData(data));
      } catch (error) {
        dispatch(setDashboardError({ 
          section: 'wellness', 
          error: error.message || 'Failed to refresh wellness data' 
        }));
      }
    },
    refreshUpcoming: async () => {
      try {
        dispatch(setDashboardLoading({ section: 'upcoming', loading: true }));
        const data = await dashboardService.getUpcomingDoses();
        dispatch(updateUpcomingDoses(data));
      } catch (error) {
        dispatch(setDashboardError({ 
          section: 'upcoming', 
          error: error.message || 'Failed to refresh upcoming doses' 
        }));
      }
    },
    refreshInsights: async () => {
      try {
        dispatch(setDashboardLoading({ section: 'insights', loading: true }));
        const data = await dashboardService.getInsights();
        dispatch(updateInsights(data));
      } catch (error) {
        dispatch(setDashboardError({ 
          section: 'insights', 
          error: error.message || 'Failed to refresh insights' 
        }));
      }
    },
    refreshEffectiveness: async () => {
      try {
        dispatch(setDashboardLoading({ section: 'effectiveness', loading: true }));
        const data = await dashboardService.getPotionEffectiveness(timeRange);
        dispatch(updateEffectiveness(data));
      } catch (error) {
        dispatch(setDashboardError({ section: 'effectiveness', error: error.message || 'Failed to refresh effectiveness' }));
      }
    },
    isInitialLoad
  };
};

export default useGetDashboardData;