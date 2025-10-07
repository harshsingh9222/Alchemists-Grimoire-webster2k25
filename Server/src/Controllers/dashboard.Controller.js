// ========================================
// server/controllers/dashboardController.js
// ========================================
import Medicine from "../Models/medicineModel.js";
import DoseLog from "../Models/doseLogModel.js";
import WellnessScore from "../Models/wellnessScoreModel.js";
import Notification from "../Models/notificationModel.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

// Helper function to get date range
const getDateRange = (timeRange) => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  
  switch (timeRange) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7); // Default to week
  }
  
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate };
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
  
  // Initialize all days in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    dailyData[dateKey] = {
      date: dateKey,
      day: dayNames[d.getDay()],
      taken: 0,
      missed: 0,
      total: 0
    };
  }
  
  // Count doses per day
  doseLogs.forEach(log => {
    const dateKey = log.scheduledTime.toISOString().split('T')[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey][log.status]++;
      dailyData[dateKey].total++;
    }
  });
  
  // Calculate percentages and format for chart
  const chartData = Object.values(dailyData).map(day => ({
    day: day.day,
    date: day.date,
    taken: day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0,
    missed: day.total > 0 ? Math.round((day.missed / day.total) * 100) : 0,
    takenCount: day.taken,
    missedCount: day.missed
  }));
  
  // Calculate overall adherence rate
  const totalTaken = doseLogs.filter(log => log.status === "taken").length;
  const overallAdherence = doseLogs.length > 0 
    ? Math.round((totalTaken / doseLogs.length) * 100)
    : 100;
  
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
  
  // Get latest wellness score
  const latestScore = await WellnessScore.findOne({ userId })
    .sort({ date: -1 })
    .limit(1);
  
  // If no score exists, create a default one based on adherence
  if (!latestScore) {
    const adherenceRate = await DoseLog.calculateAdherence(
      userId,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date()
    );
    
    const newScore = await WellnessScore.create({
      userId,
      date: new Date(),
      metrics: {
        energy: 70 + (adherenceRate * 0.2),
        focus: 65 + (adherenceRate * 0.25),
        mood: 60 + (adherenceRate * 0.3),
        sleep: 70 + (adherenceRate * 0.15),
        vitality: 75 + (adherenceRate * 0.2),
        balance: 70 + (adherenceRate * 0.2)
      },
      adherenceRate,
      factors: adherenceRate > 80 ? ["all_doses_taken"] : ["missed_doses"]
    });
    
    return res.status(200).json(
      new ApiResponse(200, {
        currentScore: newScore.overallScore,
        metrics: newScore.metrics,
        trend: 0,
        improvement: "new"
      }, "Wellness score initialized")
    );
  }
  
  // Get wellness trend
  const trend = await WellnessScore.getWellnessTrend(userId, 7);
  
  // Get radar chart data
  const radarData = Object.entries(latestScore.metrics).map(([aspect, score]) => ({
    aspect: aspect.charAt(0).toUpperCase() + aspect.slice(1),
    score,
    fullMark: 100
  }));
  
  return res.status(200).json(
    new ApiResponse(200, {
      currentScore: latestScore.overallScore,
      metrics: latestScore.metrics,
      radarData,
      trend: trend.trend,
      improvement: trend.improvement,
      lastUpdated: latestScore.date
    }, "Wellness score retrieved successfully")
  );
});

// Get upcoming doses
export const getUpcomingDoses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get all active medicines
  const medicines = await Medicine.find({
    userId,
    $or: [
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  });
  
  // Get today's dose logs
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayLogs = await DoseLog.find({
    userId,
    scheduledTime: { $gte: todayStart, $lte: endOfDay }
  });
  
  // Create upcoming doses list
  const upcomingDoses = [];
  const timeIcons = {
    morning: "Sun",
    noon: "Sun",
    evening: "Moon",
    night: "Moon"
  };
  
  medicines.forEach(medicine => {
    medicine.times.forEach(time => {
      const [hours, minutes] = time.split(':');
      const doseTime = new Date();
      doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Check if this dose is already logged
      const isLogged = todayLogs.some(log => 
        log.medicineId.toString() === medicine._id.toString() &&
        log.scheduledTime.getHours() === doseTime.getHours()
      );
      
      // Only include if it's upcoming and not logged
      if (doseTime > now && !isLogged) {
        let timeOfDay = "morning";
        const hour = parseInt(hours);
        if (hour >= 17) timeOfDay = "evening";
        else if (hour >= 12) timeOfDay = "noon";
        else if (hour >= 20) timeOfDay = "night";
        
        upcomingDoses.push({
          id: `${medicine._id}-${time}`,
          medicineId: medicine._id,
          name: medicine.medicineName,
          dosage: medicine.dosage,
          time: time,
          scheduledTime: doseTime,
          timeOfDay,
          icon: timeIcons[timeOfDay],
          color: timeOfDay === "morning" ? "yellow" : "indigo"
        });
      }
    });
  });
  
  // Sort by time
  upcomingDoses.sort((a, b) => a.scheduledTime - b.scheduledTime);
  
  // Get next 5 doses
  const nextDoses = upcomingDoses.slice(0, 5);
  
  return res.status(200).json(
    new ApiResponse(200, {
      upcomingDoses: nextDoses,
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
  let doseLog = await DoseLog.findOne({
    userId,
    medicineId,
    scheduledTime: {
      $gte: new Date(scheduledTime).setMinutes(0, 0, 0),
      $lt: new Date(scheduledTime).setMinutes(59, 59, 999)
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
    const scheduleDate = new Date(scheduledTime);
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





