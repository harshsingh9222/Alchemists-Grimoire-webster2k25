import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setDashboardData } from '../Store/dashboardSlice';
import { dashboardService } from '../Services/dashboardServices';

const useGetDashboardData = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const adherence = await dashboardService.getAdherenceData();
        const wellness = await dashboardService.getWellnessScore();
        const upcoming = await dashboardService.getUpcomingDoses();
        const insights = await dashboardService.getInsights();
        dispatch(setDashboardData({ adherence, wellness, upcoming, insights }));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    fetchDashboardData();
  }, [dispatch]);
};

export default useGetDashboardData;
