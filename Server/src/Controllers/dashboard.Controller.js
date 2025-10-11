// ========================================
// server/controllers/dashboardController.js
// ========================================
import Medicine from "../Models/medicineModel.js";
import DoseLog from "../Models/doseLogModel.js";
import WellnessScore from "../Models/wellnessScoreModel.js";
import Notification from "../Models/notificationModel.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { msFromISO } from "../Utils/time.helper.js";
import { localTimeToUTCDate } from "../Utils/timezone.helper.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

// Helper function to get local-date-bounded range (midnight..end-of-day)
const getDateRange = (timeRange) => {
  const allowed = new Set(["day", "week", "month", "year"]);
  const range = allowed.has(timeRange) ? timeRange : "week";

  const endDate = new Date();
  // Use local end-of-day
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  switch (range) {
    case "day":
      // today only
      break;
    case "week":
      // last 7 days including today
      startDate.setDate(startDate.getDate() - 6);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  // Use local start-of-day
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
};

// Decide whether a medicine applies on a particular local date (mirrors dose controller)
const medicineAppliesOnDate = (medicine, date) => {
  if (!medicine) return false;
  if (medicine.startDate && new Date(medicine.startDate) > date) return false;
  if (medicine.frequency === 'daily') return true;
  if (medicine.frequency === 'weekly') {
    if (Array.isArray(medicine.days) && medicine.days.length > 0) {
      return medicine.days.includes(date.getDay());
    }
    const startDay = medicine.startDate ? new Date(medicine.startDate).getDay() : null;
    return startDay === date.getDay();
  }
  if (medicine.frequency === 'as-needed') return false;
  return true;
};

// Get adherence data for charts
export const getAdherenceData = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const userId = req.user._id;
  
  const { startDate, endDate } = getDateRange(timeRange);
  
  // Get dose logs for the period
  const doseLogs = await DoseLog.find({
    userId,
    scheduledTime: { $gte: startDate, $lte: endDate },
    status: { $in: ["taken", "missed"] }
  }).populate('medicineId', 'medicineName');
  
  // Group by day for chart data
  const dailyData = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Helper to format local YYYY-MM-DD
  const formatLocalDateKey = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Initialize all days in range (local dates)
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = formatLocalDateKey(d);
    dailyData[dateKey] = {
      date: dateKey,
      day: dayNames[d.getDay()],
      taken: 0,
      missed: 0,
      total: 0,
    };
  }
  
  // Count doses per day using local date keys
  doseLogs.forEach(log => {
    const s = new Date(log.scheduledTime);
    const dateKey = formatLocalDateKey(s);
    if (dailyData[dateKey]) {
      dailyData[dateKey][log.status]++;
      dailyData[dateKey].total++;
    }
  });
  
  // Calculate percentages and format for chart
  const chartData = Object.values(dailyData).map((day) => {
    if (day.total > 0) {
      const takenPct = Math.round((day.taken / day.total) * 100);
      const missedPct = 100 - takenPct; // guarantee sums to 100%
      return {
        day: day.day,
        date: day.date,
        taken: takenPct,
        missed: missedPct,
        takenCount: day.taken,
        missedCount: day.missed,
        total: day.total,
      };
    }
    // No doses scheduled/logged that day: show 0/100 for visual clarity
    return {
      day: day.day,
      date: day.date,
      taken: 0,
      missed: 0,
      takenCount: 0,
      missedCount: 0,
      total: 0,
    };
  });
  
  // Calculate overall adherence rate
  const totalTaken = doseLogs.filter(log => log.status === "taken").length;
  // If there are no dose logs in the requested range, return 0% adherence rather than 100%
  // which is misleading (100% would imply perfect adherence even though there were no doses).
  const overallAdherence = doseLogs.length > 0 
    ? Math.round((totalTaken / doseLogs.length) * 100)
    : 0;
  
  return res.status(200).json(
    new ApiResponse(200, {
      chartData,
      overallAdherence,
      totalDoses: doseLogs.length,
      totalTaken,
      totalMissed: doseLogs.length - totalTaken
    }, "Adherence data retrieved successfully")
  );
});

// Get wellness score and metrics
export const getWellnessScore = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = 'week' } = req.query;

  // Build date range using existing helper (local start/end)
  const { startDate, endDate } = getDateRange(timeRange);

  // Iterate days in range and collect wellness scores (use stored if present else synthesize)
  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Try to find an existing WellnessScore for this exact day (stored at midnight)
    const ws = await WellnessScore.findOne({ userId, date: dayStart });
    if (ws) {
      days.push({ date: new Date(dayStart), metrics: ws.metrics, overallScore: ws.overallScore, hasData: true });
      continue;
    }

    // No stored wellness score: check if there are any DoseLog entries that day.
    const logsCount = await DoseLog.countDocuments({ userId, scheduledTime: { $gte: dayStart, $lte: dayEnd } });
    if (logsCount === 0) {
      // No data for this day; mark as empty so it can be excluded from aggregation if desired
      days.push({ date: new Date(dayStart), metrics: null, overallScore: 0, hasData: false });
      continue;
    }

    // Synthesize from adherence for that day
    const adherenceRate = await DoseLog.calculateAdherence(userId, dayStart, dayEnd);

    const metrics = {
      energy: Math.min(100, Math.max(0, 70 + (adherenceRate * 0.2))),
      focus: Math.min(100, Math.max(0, 65 + (adherenceRate * 0.25))),
      mood: Math.min(100, Math.max(0, 60 + (adherenceRate * 0.3))),
      sleep: Math.min(100, Math.max(0, 70 + (adherenceRate * 0.15))),
      vitality: Math.min(100, Math.max(0, 75 + (adherenceRate * 0.2))),
      balance: Math.min(100, Math.max(0, 70 + (adherenceRate * 0.2)))
    };

    const overallScore = Math.round(Object.values(metrics).reduce((a, b) => a + b, 0) / Object.keys(metrics).length);
    days.push({ date: new Date(dayStart), metrics, overallScore, adherenceRate, hasData: true });
  }

  // Aggregate across days: include empty/no-data days in the averaging pool and count missing metrics as zeros.
  // This makes the radar and overall score reflect missed/empty days as weaker performance.
  const pool = days; // always include every day in the range

  const totalPool = pool.length || 1;
  const avgOverall = Math.round(pool.reduce((s, d) => s + (d.overallScore || 0), 0) / totalPool);

  const metricKeys = ['energy', 'focus', 'mood', 'sleep', 'vitality', 'balance'];
  const radarData = metricKeys.map((key) => {
    const avg = Math.round(pool.reduce((s, d) => s + (d.metrics?.[key] || 0), 0) / totalPool);
    return { aspect: key.charAt(0).toUpperCase() + key.slice(1), score: avg, fullMark: 100 };
  });

  // Trend: difference between the first and last day in the full range (empty days count as zeros)
  const firstData = pool[0] || { overallScore: 0 };
  const lastData = pool[pool.length - 1] || firstData;
  const trendValue = (lastData?.overallScore || 0) - (firstData?.overallScore || 0);
  const improvement = trendValue > 0 ? 'improving' : (trendValue < 0 ? 'declining' : 'stable');

  return res.status(200).json(
    new ApiResponse(200, {
      currentScore: avgOverall,
      metrics: pool.length === 1 ? pool[0].metrics : undefined,
      radarData,
      trend: trendValue,
      improvement,
      days,
      lastUpdated: (lastData?.date) || new Date()
    }, "Wellness score retrieved successfully")
  );
});

// Get upcoming doses
export const getUpcomingDoses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  // Fetch pending DoseLog entries for the remainder of today (created by doseLogCreater)
  // These logs have already had scheduledTime computed with timezone helpers, so prefer them.
  const upcomingLogs = await DoseLog.find({
    userId,
    status: 'pending',
    scheduledTime: { $gte: now, $lte: endOfDay }
  }).populate('medicineId').sort({ scheduledTime: 1 });

  const timeIcons = {
    morning: "Sun",
    noon: "Sun",
    evening: "Moon",
    night: "Moon"
  };

  const upcomingDoses = upcomingLogs.map((dose) => {
    const med = dose.medicineId || {};
    const s = new Date(dose.scheduledTime);
    const hour = s.getHours();
    let timeOfDay = 'morning';
    if (hour >= 20) timeOfDay = 'night';
    else if (hour >= 17) timeOfDay = 'evening';
    else if (hour >= 12) timeOfDay = 'noon';

    return {
      id: String(dose._id),
      medicineId: med._id || null,
      name: med.medicineName || med.name || 'Medicine',
      dosage: med.dosage || dose.dosage || null,
      time: s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      scheduledTime: s,
      timeOfDay,
      iconName: timeIcons[timeOfDay],
      color: timeOfDay === 'morning' ? 'yellow' : 'indigo'
    };
  });
  
  // Sort by time
  upcomingDoses.sort((a, b) => a.scheduledTime - b.scheduledTime);
  
  // Get next 5 doses
  const nextDoses = upcomingDoses.slice(0, 5);
  // Group upcoming doses by medicine to produce a medicines array where each entry
  // contains the next scheduled dose for that medicine. This is useful for UIs
  // that want to show one card per medicine rather than each scheduled dose.
  const medsMap = new Map();
  for (const dose of upcomingDoses) {
    const mid = dose.medicineId.toString();
    if (!medsMap.has(mid)) {
      medsMap.set(mid, dose);
    } else {
      // keep the earliest scheduledTime for that medicine
      const existing = medsMap.get(mid);
      if (dose.scheduledTime < existing.scheduledTime) {
        medsMap.set(mid, dose);
      }
    }
  }

  const upcomingMedicines = Array.from(medsMap.values()).map(d => ({
    medicineId: d.medicineId,
    name: d.name,
    dosage: d.dosage,
    scheduledTime: d.scheduledTime,
    time: d.time,
    timeOfDay: d.timeOfDay,
    iconName: d.iconName,
    color: d.color
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      // compact next few doses (for quick glance)
      upcomingDoses: nextDoses,
      // full list of upcoming dose instances for the day
      upcomingDosesAll: upcomingDoses,
      // grouped list (one per medicine) with the next scheduled dose
      upcomingMedicines,
      totalToday: upcomingDoses.length
    }, "Upcoming doses retrieved successfully")
  );
});

// Get dashboard insights
export const getDashboardInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const insights = [];
  
  // Get pattern insights
  const patterns = await DoseLog.getPatternInsights(userId, 30);
  
  // Check for consistent morning routine
  const morningAdherence = patterns.hourPattern[8] || { taken: 0, missed: 0 };
  const morningRate = morningAdherence.taken + morningAdherence.missed > 0
    ? (morningAdherence.taken / (morningAdherence.taken + morningAdherence.missed)) * 100
    : 0;
  
  if (morningRate > 90 && morningAdherence.taken >= 7) {
    insights.push({
      type: "success",
      icon: "CheckCircle",
      title: "Excellent Morning Routine!",
      message: `You've maintained ${Math.round(morningRate)}% adherence for morning doses. Your consistency is paying off!`,
      priority: "medium"
    });
  }
  
  // Check for weekend issues
  const weekendDays = patterns.problematicDays.filter(d => d.day === 0 || d.day === 6);
  if (weekendDays.length > 0) {
    insights.push({
      type: "warning",
      icon: "AlertCircle",
      title: "Weekend Pattern Detected",
      message: "Your adherence drops on weekends. Consider setting special weekend reminders!",
      priority: "high"
    });
  }
  
  // Check for evening dose issues
  const eveningProblems = patterns.problematicHours.filter(h => h.hour >= 18 && h.hour <= 22);
  if (eveningProblems.length > 0) {
    insights.push({
      type: "warning",
      icon: "AlertCircle",
      title: "Evening Doses Need Attention",
      message: "Evening doses are frequently missed. Try pairing them with dinner or bedtime routine.",
      priority: "high"
    });
  }
  
  // Check for achievements
  const recentAdherence = await DoseLog.calculateAdherence(
    userId,
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    new Date()
  );
  
  if (recentAdherence >= 85) {
    insights.push({
      type: "achievement",
      icon: "Award",
      title: "Consistency Conjurer Unlocked!",
      message: `Amazing! You've maintained ${recentAdherence}% adherence for 2 weeks straight!`,
      priority: "low"
    });
  }
  
  // Add a motivational insight
  const totalMedicines = await Medicine.countDocuments({ userId });
  insights.push({
    type: "info",
    icon: "Sparkles",
    title: "Your Alchemical Journey",
    message: `You're managing ${totalMedicines} potions. Keep up the magical work!`,
    priority: "low"
  });
  
  return res.status(200).json(
    new ApiResponse(200, {
      insights,
      patterns: {
        problematicDays: patterns.problematicDays,
        problematicHours: patterns.problematicHours
      }
    }, "Insights retrieved successfully")
  );
});

// Get statistics overview
export const getStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = 'week' } = req.query;
  const { startDate, endDate } = getDateRange(timeRange);
  
  // Get adherence rate
  const adherenceRate = await DoseLog.calculateAdherence(userId, startDate, endDate);
  
  // Get active medicines count
  const activeMedicines = await Medicine.countDocuments({
    userId,
    $or: [
      { endDate: null },
      { endDate: { $gte: new Date() } }
    ]
  });
  
  // Get doses taken count
  const dosesTaken = await DoseLog.countDocuments({
    userId,
    status: "taken",
    scheduledTime: { $gte: startDate, $lte: endDate }
  });
  
  // Get wellness trend
  const wellnessTrend = await WellnessScore.getWellnessTrend(userId, 7);
  
  // Calculate trend percentages
  const lastWeekAdherence = await DoseLog.calculateAdherence(
    userId,
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  const adherenceTrend = adherenceRate - lastWeekAdherence;
  
  return res.status(200).json(
    new ApiResponse(200, {
      stats: {
        adherenceRate: {
          value: `${adherenceRate}%`,
          label: "Adherence Rate",
          trend: adherenceTrend
        },
        activePotions: {
          value: activeMedicines.toString(),
          label: "Active Potions",
          trend: 0
        },
        dosesTaken: {
          value: dosesTaken.toString(),
          label: "Doses Taken",
          trend: 0
        },
        wellnessScore: {
          value: wellnessTrend.currentScore ? `${wellnessTrend.currentScore}%` : "N/A",
          label: "Wellness Score",
          trend: wellnessTrend.trend
        }
      }
    }, "Statistics retrieved successfully")
  );
});

// Get potion effectiveness (medicine performance)
export const getPotionEffectiveness = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = 'week' } = req.query;
  const { startDate, endDate } = getDateRange(timeRange);
  
  // Get all medicines with their adherence
  const medicines = await Medicine.find({ userId });
  
  const effectiveness = await Promise.all(
    medicines.map(async (medicine) => {
      const logs = await DoseLog.find({
        userId,
        medicineId: medicine._id,
        scheduledTime: { $gte: startDate, $lte: endDate },
        status: { $in: ["taken", "missed"] }
      });
      
      const taken = logs.filter(l => l.status === "taken").length;
      const total = logs.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 100;
      
      // Determine time of day
      let timeOfDay = "various";
      if (medicine.times.length === 1) {
        const hour = parseInt(medicine.times[0].split(':')[0]);
        if (hour < 12) timeOfDay = "morning";
        else if (hour < 17) timeOfDay = "afternoon";
        else if (hour < 21) timeOfDay = "evening";
        else timeOfDay = "night";
      }
      
      return {
        potion: medicine.medicineName,
        effectiveness: rate,
        time: timeOfDay,
        doses: total
      };
    })
  );
  
  // Sort by effectiveness
  effectiveness.sort((a, b) => b.effectiveness - a.effectiveness);
  
  return res.status(200).json(
    new ApiResponse(200, {
      potions: effectiveness.slice(0, 5) // Top 5 medicines
    }, "Potion effectiveness retrieved successfully")
  );
});

// Record a dose as taken
export const recordDose = asyncHandler(async (req, res) => {
  const { medicineId, scheduledTime, status = "taken", notes } = req.body;
  const userId = req.user._id;
  
  // Check if dose log already exists
  const schedDate = new Date(scheduledTime);
  const schedStart = new Date(schedDate);
  schedStart.setMinutes(0, 0, 0);
  const schedEnd = new Date(schedDate);
  schedEnd.setMinutes(59, 59, 999);

  let doseLog = await DoseLog.findOne({
    userId,
    medicineId,
    scheduledTime: {
      $gte: schedStart,
      $lt: schedEnd
    }
  });
  
  if (doseLog) {
    // Update existing log
    doseLog.status = status;
    doseLog.actualTime = status === "taken" ? new Date() : null;
    doseLog.notes = notes || doseLog.notes;
    doseLog.confirmedBy = "user";
  } else {
    // Create new log
      const ms = msFromISO(scheduledTime);
      const scheduleDate = ms === null ? new Date(scheduledTime) : new Date(ms);
    doseLog = new DoseLog({
      userId,
      medicineId,
      scheduledTime: scheduleDate,
      actualTime: status === "taken" ? new Date() : null,
      status,
      notes,
      confirmedBy: "user",
      dayOfWeek: scheduleDate.getDay(),
      hour: scheduleDate.getHours()
    });
  }
  
  await doseLog.save();
  
  // Update today's wellness score
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const adherenceRate = await DoseLog.calculateAdherence(userId, today, new Date());
  
  await WellnessScore.findOneAndUpdate(
    { userId, date: today },
    { adherenceRate },
    { upsert: true }
  );
  
  return res.status(200).json(
    new ApiResponse(200, {
      doseLog,
      message: status === "taken" ? "Great job! Dose recorded." : "Dose status updated."
    }, "Dose recorded successfully")
  );
});




