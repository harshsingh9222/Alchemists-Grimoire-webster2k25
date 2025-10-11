import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  Sparkles,
  Beaker,
  Clock,
  TrendingUp,
  AlertCircle,
  Activity,
  Star,
  Moon,
  Sun,
  Zap,
  Heart,
  Shield,
  Award,
  Target,
  CheckCircle,
  Pill,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import useGetDashboardData from "../../Hooks/useGetDashboardData.js";
import { dashboardService } from "../../Services/dashboardServices.js";
import { useToast } from "../../Components/Toast/ToastProvider.jsx";
import { isNowWithinWindow } from "../../Utils/time.helper";

// Custom tooltip (module-scoped so propTypes can be attached)
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const base = payload[0]?.payload || {};
  const takenCount = base.takenCount ?? base.taken_count ?? null;
  const missedCount = base.missedCount ?? base.missed_count ?? null;
  const totalCount = (takenCount ?? 0) + (missedCount ?? 0);

  const seriesColor = (key) => (key === "taken" ? "#a78bfa" : "#ec4899");

  return (
    <div className="bg-purple-950/95 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3">
      <p className="text-purple-300 font-semibold">{label}</p>
      {payload.map((entry, idx) => {
        const key = entry.dataKey; // 'taken' | 'missed'
        const isTaken = key === "taken";
        const count = isTaken ? takenCount : missedCount;
        const percent =
          count != null && totalCount > 0
            ? Math.round((Number(count) / Number(totalCount)) * 100)
            : Math.round(Number(entry.value ?? 0));
        const labelText =
          count != null ? `${count} (${percent}%)` : `${percent}%`;
        return (
          <p key={idx} className="text-sm" style={{ color: seriesColor(key) }}>
            {entry.name}: {labelText}
          </p>
        );
      })}
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// Loading Skeleton for cards
const LoadingSkeleton = ({ className = "" }) => (
  <div
    className={`relative bg-gradient-to-br from-purple-950/60 via-purple-900/50 to-indigo-950/60 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden animate-pulse ${className}`}
  >
    <div className="absolute inset-0 opacity-30">
      <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse" />
    </div>
    <div className="relative p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-purple-400/30 rounded animate-pulse" />
        <div className="w-32 h-5 bg-purple-400/30 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-4 bg-purple-400/20 rounded animate-pulse" />
        <div className="w-3/4 h-4 bg-purple-400/20 rounded animate-pulse" />
        <div className="w-1/2 h-4 bg-purple-400/20 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

// Error State Component
const ErrorState = ({ title = "Something went wrong", message, onRetry }) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center">
      <AlertCircle className="w-8 h-8 text-red-400" />
    </div>
    <h3 className="text-lg font-semibold text-purple-300 mb-2">{title}</h3>
    {message && <p className="text-purple-400/70 mb-4 text-sm">{message}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center gap-2 mx-auto text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    )}
  </div>
);

// Reusable Magical Card Component with loading/error states
const MagicalCard = ({
  children,
  className = "",
  glowColor = "purple",
  title,
  icon: Icon,
  loading = false,
  error = null,
  onRetry,
  loadingHeight = "auto",
}) => {
  if (loading) {
    return (
      <div className={className}>
        <LoadingSkeleton
          className={loadingHeight === "chart" ? "h-[400px]" : ""}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`relative bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-indigo-950/90 backdrop-blur-sm rounded-2xl border border-red-500/30 overflow-hidden ${className}`}
      >
        {(title || Icon) && (
          <div className="relative p-4 border-b border-red-500/20">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-gradient-to-br from-red-500/30 to-pink-500/30 rounded-lg">
                  <Icon className="w-5 h-5 text-red-300" />
                </div>
              )}
              {title && (
                <h3 className="text-lg font-bold bg-gradient-to-r from-red-300 to-pink-300 bg-clip-text text-transparent">
                  {title}
                </h3>
              )}
            </div>
          </div>
        )}
        <div className="relative p-4">
          <ErrorState
            title="Failed to load data"
            message={error}
            onRetry={onRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Magical glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-${glowColor}-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Card content */}
      <div className="relative bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-indigo-950/90 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden">
        {/* Animated sparkles background */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 25}%`,
                animation: `float ${3 + i}s ease-in-out infinite`,
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
          ))}
        </div>

        {/* Header */}
        {(title || Icon) && (
          <div className="relative p-4 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg">
                  <Icon className="w-5 h-5 text-purple-300" />
                </div>
              )}
              {title && (
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {title}
                </h3>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative p-4">{children}</div>
      </div>
    </div>
  );
};

// Reusable Stats Orb Component with loading state
const StatsOrb = ({ value, label, icon: Icon, color = 'purple', trend, loading = false, error = null, onRetry }) => {
  if (loading) {
    return (
      <div className="relative group cursor-pointer">
        <div className="transform">
          <div className="relative bg-gradient-to-br from-purple-900/60 to-purple-950/80 backdrop-blur-sm rounded-full p-6 border-2 border-purple-500/30 animate-pulse">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-purple-400/30 rounded animate-pulse" />
            </div>
            <div className="w-16 h-8 bg-purple-400/30 rounded mx-auto mb-2 animate-pulse" />
            <div className="w-12 h-3 bg-purple-400/20 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative group cursor-pointer">
        <div className="transform">
          <div className="relative bg-gradient-to-br from-red-900/60 to-purple-950/80 backdrop-blur-sm rounded-full p-6 border-2 border-red-500/30">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-xs text-red-300">Error</div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const colorMap = {
    purple: {
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      bgFrom: 'from-purple-900/80',
      bgTo: 'to-purple-950/90',
      border: 'border-purple-500/50',
      icon: 'text-purple-400',
      textFrom: 'from-purple-300',
      textTo: 'to-purple-100'
    },
    pink: {
      gradientFrom: 'from-pink-500',
      gradientTo: 'to-pink-600',
      bgFrom: 'from-pink-900/80',
      bgTo: 'to-pink-950/90',
      border: 'border-pink-500/50',
      icon: 'text-pink-400',
      textFrom: 'from-pink-300',
      textTo: 'to-pink-100'
    },
    green: {
      gradientFrom: 'from-green-500',
      gradientTo: 'to-green-600',
      bgFrom: 'from-green-900/80',
      bgTo: 'to-green-950/90',
      border: 'border-green-500/50',
      icon: 'text-green-400',
      textFrom: 'from-green-300',
      textTo: 'to-green-100'
    },
    yellow: {
      gradientFrom: 'from-yellow-500',
      gradientTo: 'to-yellow-600',
      bgFrom: 'from-yellow-900/80',
      bgTo: 'to-yellow-950/90',
      border: 'border-yellow-500/50',
      icon: 'text-yellow-400',
      textFrom: 'from-yellow-300',
      textTo: 'to-yellow-100'
    },
    blue: {
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      bgFrom: 'from-blue-900/80',
      bgTo: 'to-blue-950/90',
      border: 'border-blue-500/50',
      icon: 'text-blue-400',
      textFrom: 'from-blue-300',
      textTo: 'to-blue-100'
    }
  };

  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="relative group cursor-pointer">
      <div className="transform transition-all duration-300 group-hover:-translate-y-2">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${c.gradientFrom} ${c.gradientTo} rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`}
        />

        <div
          className={`relative bg-gradient-to-br ${c.bgFrom} ${c.bgTo} backdrop-blur-sm rounded-full p-6 border-2 ${c.border}`}
        >
          <div className="flex justify-center mb-2">
            {Icon && <Icon className={`w-8 h-8 ${c.icon}`} />}
          </div>

          <div
            className={`text-3xl font-bold text-center bg-gradient-to-r ${c.textFrom} ${c.textTo} bg-clip-text text-transparent`}
          >
            {value}
          </div>

          <div className="text-xs text-center text-purple-300/70 mt-1">{label}</div>

          {typeof trend === 'number' && (
            <div
              className={`absolute -top-2 -right-2 px-2 py-1 ${trend > 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full text-xs text-white font-bold`}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Magical Progress Ring with loading state
const MagicalProgressRing = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-6 bg-purple-400/30 rounded animate-pulse mb-2" />
          <div className="w-16 h-4 bg-purple-400/20 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(139, 92, 246, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
          {percentage}%
        </div>
        <div className="text-xs text-purple-400">Wellness</div>
      </div>
    </div>
  );
};

// Full page loading skeleton
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 p-6">
    <div className="relative z-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Beaker className="w-8 h-8 text-purple-400 animate-pulse" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            Your Mystical Wellness Journey
          </h1>
          <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
        </div>
        <p className="text-purple-300/70">Summoning your alchemical data… ✨</p>
      </div>

      {/* Stats Orbs Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <StatsOrb key={i} loading={true} />
        ))}
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <LoadingSkeleton
            key={i}
            className={i === 1 || i === 6 ? "lg:col-span-2" : ""}
          />
        ))}
      </div>
    </div>
  </div>
);

// Main Dashboard Component
const AlchemistDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const { showToast } = useToast();

  // Safe Redux selection to avoid undefined errors
  const dashboardState = useSelector((s) => s.dashboard) || {};
  console.log("DashboardState:", dashboardState);

  // Enhanced data fetching with error handling
  const { isInitialLoad, refetch, refreshAdherence, refreshWellness, refreshUpcoming, refreshInsights } = useGetDashboardData({ 
    timeRange: selectedTimeRange,
    refreshInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
  });

  // Comprehensive fallback data
  const fallbackData = {
    adherence: {
      chartData: [
        { day: "Mon", taken: 85, missed: 15 },
        { day: "Tue", taken: 92, missed: 8 },
        { day: "Wed", taken: 78, missed: 22 },
        { day: "Thu", taken: 95, missed: 5 },
        { day: "Fri", taken: 88, missed: 12 },
        { day: "Sat", taken: 90, missed: 10 },
        { day: "Sun", taken: 82, missed: 18 },
      ],
      overallAdherence: 87,
      totalTaken: 156,
      totalDoses: 180,
    },
    wellness: {
      currentScore: 87,
      radarData: [
        { aspect: "Energy", score: 85, fullMark: 100 },
        { aspect: "Focus", score: 92, fullMark: 100 },
        { aspect: "Mood", score: 78, fullMark: 100 },
        { aspect: "Sleep", score: 88, fullMark: 100 },
        { aspect: "Vitality", score: 90, fullMark: 100 },
        { aspect: "Balance", score: 75, fullMark: 100 },
      ],
      trend: 5,
      improvement: "improving",
    },
    upcoming: {
      upcomingDoses: [
        {
          id: 1,
          name: "Morning Elixir",
          time: "8:00 AM",
          icon: Sun,
          color: "yellow",
          medicineId: "med1",
        },
        {
          id: 2,
          name: "Focus Potion",
          time: "12:00 PM",
          icon: Zap,
          color: "blue",
          medicineId: "med2",
        },
        {
          id: 3,
          name: "Evening Draft",
          time: "6:00 PM",
          icon: Moon,
          color: "indigo",
          medicineId: "med3",
        },
      ],
      totalToday: 3,
    },
    insights: {
      insights: [
        {
          type: "success",
          icon: "CheckCircle",
          title: "Excellent Morning Routine!",
          message:
            "You've taken your morning elixir consistently for 7 days. Your energy levels show a 15% improvement!",
        },
        {
          type: "warning",
          icon: "AlertCircle",
          title: "Pattern Detected",
          message:
            "Evening doses are frequently missed on weekends. Consider setting a special reminder!",
        },
        {
          type: "achievement",
          icon: "Sparkles",
          title: "New Achievement Unlocked!",
          message:
            '"Consistency Conjurer" - Maintained 85%+ adherence for 2 weeks straight!',
        },
      ],
    },
    effectiveness: [
      { potion: "Morning Elixir", effectiveness: 95, time: "morning" },
      { potion: "Noon Tonic", effectiveness: 88, time: "noon" },
      { potion: "Evening Draft", effectiveness: 92, time: "evening" },
      { potion: "Night Serum", effectiveness: 78, time: "night" },
    ],
  };

  // Extract data with safe fallbacks
  const adherenceData =
    dashboardState?.adherence?.data || fallbackData.adherence;
  const wellnessData = dashboardState?.wellness?.data || fallbackData.wellness;
  const upcomingData = dashboardState?.upcoming?.data || fallbackData.upcoming;
  const insightsData = dashboardState?.insights?.data || fallbackData.insights;
  // Use backend effectiveness when available
  const potionEffectivenessData =
    dashboardState?.effectiveness?.data?.potions || fallbackData.effectiveness;

  // Loading states
  const adherenceLoading = dashboardState?.adherence?.loading || false;
  const wellnessLoading = dashboardState?.wellness?.loading || false;
  const upcomingLoading = dashboardState?.upcoming?.loading || false;
  const insightsLoading = dashboardState?.insights?.loading || false;

  // Error states
  const adherenceError = dashboardState?.adherence?.error || null;
  const wellnessError = dashboardState?.wellness?.error || null;
  const upcomingError = dashboardState?.upcoming?.error || null;
  const insightsError = dashboardState?.insights?.error || null;

  // Computed values for UI
  const overallAdherence = adherenceData?.overallAdherence ?? fallbackData.adherence.overallAdherence;
  const wellnessScore = wellnessData?.currentScore ?? fallbackData.wellness.currentScore;
  const totalTaken = adherenceData?.totalTaken ?? fallbackData.adherence.totalTaken;
  const statisticsData = dashboardState?.statistics?.data || null;
  // Backend now returns grouped upcomingMedicines (one per medicine) and upcomingDoses/upcomingDosesAll.
  // Prefer upcomingMedicines for the dashboard list. Keep fallback to older upcomingDoses for compatibility.
  const upcomingDosesData = upcomingData?.upcomingMedicines ?? upcomingData?.upcomingDoses ?? fallbackData.upcoming.upcomingDoses;
  // Also get the full list of upcoming dose instances for today (used to compute currently active potions)
  const upcomingDosesAll = upcomingData?.upcomingDosesAll ?? upcomingData?.upcomingDoses ?? fallbackData.upcoming.upcomingDoses;
  // Count doses for which the "Take" button would be enabled (same rules as TodayDoses):
  // - exclude doses already taken or missed
  // - if scheduledTime is missing, allow taking
  // - otherwise allow when isNowWithinWindow(scheduled, 15)
  const activeFromUpcoming = (upcomingDosesAll || []).filter((d) => {
    const isComplete = d.status === 'taken';
    const isMissed = d.status === 'missed';
    if (isComplete || isMissed) return false;
    const scheduled = d.scheduledTime ? new Date(d.scheduledTime) : null;
    if (!scheduled) return true;
    return isNowWithinWindow(scheduled, 15);
  }).length;
  // Use the client-side computed count as the authoritative "active doses right now" value
  const activePotionsCount = activeFromUpcoming;
  // Debug: log the raw upcoming payload to verify backend shape
  useEffect(() => {
    console.log('DEBUG upcoming payload from backend:', upcomingData);
  }, [upcomingData]);
  const radarData = wellnessData?.radarData ?? fallbackData.wellness.radarData;
  const chartData =
    adherenceData?.chartData ?? fallbackData.adherence.chartData;

  // console.log('Overall Adherence:', overallAdherence);
  // console.log('wellnessScore:', wellnessScore);

  // Log only UI-relevant fields (no internal IDs/timestamps or raw objects)
  const uiAdherence = {
    overallAdherence,
    chartData: (chartData || []).map(({ day, taken, missed }) => ({
      day,
      taken,
      missed,
    })),
  };
  const uiWellness = {
    wellnessScore,
    radarData: (radarData || []).map(({ aspect, score }) => ({
      aspect,
      score,
    })),
  };
  const uiUpcoming = (upcomingDosesData || []).map(
    ({ id, name, time, color }) => ({ id, name, time, color })
  );
  const uiInsights = (insightsData?.insights || []).map(
    ({ type, title, message }) => ({ type, title, message })
  );
  const uiEffectiveness = (potionEffectivenessData || []).map(
    ({ potion, effectiveness }) => ({ potion, effectiveness })
  );

  console.log("UI Data:", {
    adherence: uiAdherence,
    wellness: uiWellness,
    upcoming: uiUpcoming,
    insights: uiInsights,
    effectiveness: uiEffectiveness,
  });

  // Pie data from adherence
  const pieData = [
    { name: "Taken", value: Math.round(overallAdherence), color: "#a78bfa" },
    {
      name: "Missed",
      value: 100 - Math.round(overallAdherence),
      color: "#ec4899",
    },
  ];

  // Handle dose taking with optimistic updates
  const handleTake = async (dose) => {
    try {
      await dashboardService.recordDose({
        medicineId: dose.medicineId || null,
        scheduledTime: dose.scheduledTime || new Date().toISOString(),
        actualTime: new Date().toISOString(),
        status: "taken",
        notes: "Marked from dashboard",
      });
      // Refresh relevant sections
      refetch();
    } catch (error) {
      console.error("Failed to record dose:", error);
      if (
        error?.response?.status === 403 ||
        (error?.message && error.message.includes("Too early to mark"))
      ) {
        showToast(
          "Too early to mark this dose as taken. You can take it starting 15 minutes before scheduled time.",
          "error"
        );
      } else {
        showToast("Failed to record dose. Please try again.", "error");
      }
      // Could show toast notification here
    }
  };

  // Icon mapping for insights
  const getInsightIcon = (iconName) => {
    const iconMap = { CheckCircle, AlertCircle, Sparkles, Award, TrendingUp };
    return iconMap[iconName] || Sparkles;
  };

  const getInsightColor = (type) => {
    const colors = {
      success: "from-green-900/30 to-emerald-900/30 border-green-500/20",
      warning: "from-yellow-900/30 to-amber-900/30 border-yellow-500/20",
      achievement: "from-purple-900/30 to-indigo-900/30 border-purple-500/20",
      info: "from-blue-900/30 to-cyan-900/30 border-blue-500/20",
    };
    return (
      colors[type] || "from-gray-900/30 to-slate-900/30 border-gray-500/20"
    );
  };

  const getInsightTextColor = (type) => {
    const colors = {
      success: "text-green-300",
      warning: "text-yellow-300",
      achievement: "text-purple-300",
      info: "text-blue-300",
    };
    return colors[type] || "text-gray-300";
  };

  const getInsightIconColor = (type) => {
    const colors = {
      success: "text-green-400",
      warning: "text-yellow-400",
      achievement: "text-purple-400",
      info: "text-blue-400",
    };
    return colors[type] || "text-gray-400";
  };
  // Custom tooltip for charts (implemented at module scope; propTypes added below)

  // Show full skeleton on initial load
  if (isInitialLoad) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${15 + i * 5}s`,
            }}
          >
            <div className="w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
              Your Mystical Wellness Journey
            </span>
          </h1>
          <p className="text-purple-300/70">
            Track your alchemical potions and enhance your vitality
          </p>

          {/* Enhanced controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {["day", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedTimeRange === range
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={refetch}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Orbs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsOrb
            value={`${overallAdherence}%`}
            label="Adherence Rate"
            icon={Target}
            color="purple"
            trend={5}
            loading={adherenceLoading}
            error={adherenceError}
            onRetry={refreshAdherence}
          />
          <StatsOrb
            value={`${activePotionsCount}`}
            label="Active Potions"
            icon={Beaker}
            color="pink"
            trend={-2}
            loading={upcomingLoading}
            error={upcomingError}
            onRetry={refreshUpcoming}
          />
          <StatsOrb
            value={`${statisticsData?.stats?.dosesTaken?.value ?? totalTaken}`}
            label="Doses Taken"
            icon={CheckCircle}
            color="green"
            loading={adherenceLoading}
            error={adherenceError}
            onRetry={refreshAdherence}
          />
          <StatsOrb
            value={(Math.round((wellnessScore / 20) * 10) / 10).toFixed(1)}
            label="Wellness Score"
            icon={Star}
            color="yellow"
            trend={8}
            loading={wellnessLoading}
            error={wellnessError}
            onRetry={refreshWellness}
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Adherence Chart */}
          <MagicalCard
            className="lg:col-span-2"
            title="Potion Adherence Pattern"
            icon={Activity}
            loading={adherenceLoading}
            error={adherenceError}
            onRetry={refreshAdherence}
            loadingHeight="chart"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(139, 92, 246, 0.1)"
                />
                <XAxis dataKey="day" stroke="#a78bfa" />
                <YAxis
                  stroke="#a78bfa"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="taken"
                  name="Taken"
                  fill="url(#takenGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="missed"
                  name="Missed"
                  fill="url(#missedGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient
                    id="takenGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient
                    id="missedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#be185d" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </MagicalCard>

          {/* Wellness Score */}
          <MagicalCard
            title="Mystical Wellness"
            icon={Heart}
            loading={wellnessLoading}
            error={wellnessError}
            onRetry={refreshWellness}
          >
            <div className="flex flex-col items-center py-4">
              <MagicalProgressRing
                percentage={wellnessScore}
                loading={wellnessLoading}
              />
              {!wellnessLoading && (
                <div className="mt-4 text-center">
                  <p className="text-purple-300/70 text-sm">
                    Your potions are working!
                  </p>
                  <p className="text-xs text-purple-400/50 mt-1">
                    +5% from last week
                  </p>
                </div>
              )}
            </div>
          </MagicalCard>

          {/* Upcoming Doses */}
          <MagicalCard
            title="Upcoming Potions"
            icon={Clock}
            loading={upcomingLoading}
            error={upcomingError}
            onRetry={refreshUpcoming}
          >
            <div className="space-y-3">
              {upcomingDosesData.map((dose) => {
                // server now sends an iconName string; map it to an imported component
                const iconMap = { Sun, Moon, Zap };
                const DoseIcon = dose.iconName ? (iconMap[dose.iconName] || Sun) : (dose.icon || Sun);
                const color = dose.color || 'yellow';
                // determine scheduled Date if available and normalize to Date object
                const scheduled = dose.scheduledTime ? new Date(dose.scheduledTime) : null;
                const canTake = scheduled ? isNowWithinWindow(scheduled, 15) : false;
                return (
                  <div
                    key={dose.id}
                    className="flex items-center justify-between p-3 bg-purple-900/30 rounded-lg hover:bg-purple-900/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
                        <DoseIcon className={`w-4 h-4 text-${color}-400`} />
                      </div>
                      <div>
                        <p className="text-purple-200 font-medium text-sm">
                          {dose.name}
                        </p>
                        <p className="text-purple-400/60 text-xs">
                          {dose.time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const scheduledIso = scheduled ? scheduled.toISOString() : new Date().toISOString();
                        handleTake({ ...dose, scheduledTime: scheduledIso });
                      }}
                      disabled={!canTake}
                      title={
                        !canTake
                          ? "You can take this dose starting 15 minutes before its scheduled time"
                          : "Take"
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        !canTake
                          ? "bg-gray-700/40 text-gray-300 cursor-not-allowed"
                          : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                      }`}
                    >
                      Take
                    </button>
                  </div>
                );
              })}
            </div>
          </MagicalCard>

          {/* Wellness Radar */}
          <MagicalCard
            title="Vitality Matrix"
            icon={Shield}
            loading={wellnessLoading}
            error={wellnessError}
            onRetry={refreshWellness}
            loadingHeight="chart"
          >
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(139, 92, 246, 0.2)" />
                <PolarAngleAxis dataKey="aspect" stroke="#a78bfa" />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  stroke="#a78bfa"
                />
                <Radar
                  name="Wellness"
                  dataKey="score"
                  stroke="#ec4899"
                  fill="url(#radarGradient)"
                  fillOpacity={0.6}
                />
                <defs>
                  <linearGradient
                    id="radarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </MagicalCard>

          {/* Potion Effectiveness */}
          <MagicalCard title="Potion Potency" icon={Zap}>
            <div className="space-y-3">
              {potionEffectivenessData.map((potion, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">{potion.potion}</span>
                    <span className="text-purple-400">
                      {potion.effectiveness}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-900/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${potion.effectiveness}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </MagicalCard>

          {/* Alchemical Insights */}
          <MagicalCard
            className="lg:col-span-2"
            title="Alchemical Insights"
            icon={Award}
            loading={insightsLoading}
            error={insightsError}
            onRetry={refreshInsights}
          >
            <div className="space-y-3">
              {insightsData.insights?.map((insight, index) => {
                const IconComponent = getInsightIcon(insight.icon);
                const gradientClass = getInsightColor(insight.type);
                const textColor = getInsightTextColor(insight.type);
                const iconColor = getInsightIconColor(insight.type);

                return (
                  <div
                    key={index}
                    className={`p-4 bg-gradient-to-r ${gradientClass} rounded-lg border`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`w-5 h-5 ${iconColor} mt-1`} />
                      <div>
                        <p className={`${textColor} font-medium`}>
                          {insight.title}
                        </p>
                        <p
                          className={`${textColor.replace(
                            "300",
                            "400/70"
                          )} text-sm mt-1`}
                        >
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </MagicalCard>

          {/* Pie Chart */}
          <MagicalCard
            title="This Week's Balance"
            icon={Pill}
            loading={adherenceLoading}
            error={adherenceError}
            onRetry={refreshAdherence}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-purple-300 text-sm">
                    {entry.name}: {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </MagicalCard>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(-10px) rotate(240deg); }
        }
      `}</style>
    </div>
  );
};

export default AlchemistDashboard;

// PropTypes for internal components to satisfy lint rules
LoadingSkeleton.propTypes = {
  className: PropTypes.string,
};

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
};

MagicalCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  glowColor: PropTypes.string,
  title: PropTypes.string,
  icon: PropTypes.elementType,
  loading: PropTypes.bool,
  error: PropTypes.any,
  onRetry: PropTypes.func,
  loadingHeight: PropTypes.string,
};

StatsOrb.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  icon: PropTypes.elementType,
  color: PropTypes.string,
  trend: PropTypes.number,
  loading: PropTypes.bool,
  error: PropTypes.any,
  onRetry: PropTypes.func,
};

MagicalProgressRing.propTypes = {
  percentage: PropTypes.number,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  loading: PropTypes.bool,
};

DashboardSkeleton.propTypes = {};

// Note: CustomTooltip is defined inside the component scope so we don't attach propTypes here.