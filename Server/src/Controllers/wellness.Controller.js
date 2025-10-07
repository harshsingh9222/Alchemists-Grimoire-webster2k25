import WellnessScore from "../Models/wellnessScoreModel.js";
import DoseLog from "../Models/doseLogModel.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";

// Update wellness metrics
export const updateWellnessMetrics = asyncHandler(async (req, res) => {
  const { metrics, notes, date } = req.body;
  const userId = req.user._id;
  
  if (!metrics) {
    throw new ApiError(400, "Wellness metrics are required");
  }
  
  const wellnessDate = date ? new Date(date) : new Date();
  wellnessDate.setHours(0, 0, 0, 0);
  
  // Calculate adherence for the day
  const endDate = new Date(wellnessDate);
  endDate.setHours(23, 59, 59, 999);
  
  const adherenceRate = await DoseLog.calculateAdherence(userId, wellnessDate, endDate);
  
  // Determine factors based on metrics and adherence
  const factors = [];
  if (adherenceRate >= 90) factors.push('all_doses_taken');
  if (adherenceRate < 50) factors.push('missed_doses');
  if (metrics.sleep >= 80) factors.push('good_sleep');
  if (metrics.sleep < 50) factors.push('poor_sleep');
  if (metrics.energy >= 80) factors.push('exercise');
  if (metrics.mood < 50) factors.push('stress');
  
  // Create or update wellness score
  const wellnessScore = await WellnessScore.findOneAndUpdate(
    { userId, date: wellnessDate },
    {
      metrics,
      adherenceRate,
      notes,
      factors
    },
    { 
      new: true, 
      upsert: true,
      runValidators: true
    }
  );
  
  return res.status(200).json(
    new ApiResponse(200, wellnessScore, "Wellness updated successfully")
  );
});

// Get wellness history
export const getWellnessHistory = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const userId = req.user._id;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  const scores = await WellnessScore.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
  
  // Calculate trends
  const trend = await WellnessScore.getWellnessTrend(userId, parseInt(days));
  
  return res.status(200).json(
    new ApiResponse(200, {
      scores,
      trend,
      average: scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length)
        : 0
    }, "Wellness history retrieved")
  );
});

// Get today's wellness score
export const getTodayWellness = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let wellness = await WellnessScore.findOne({ userId, date: today });
  
  if (!wellness) {
    // Create default wellness score based on today's adherence
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    const adherenceRate = await DoseLog.calculateAdherence(userId, today, endDate);
    
    wellness = await WellnessScore.create({
      userId,
      date: today,
      metrics: {
        energy: 70,
        focus: 70,
        mood: 70,
        sleep: 70,
        vitality: 70,
        balance: 70
      },
      adherenceRate,
      factors: adherenceRate > 80 ? ['all_doses_taken'] : []
    });
  }
  
  return res.status(200).json(
    new ApiResponse(200, wellness, "Today's wellness retrieved")
  );
});