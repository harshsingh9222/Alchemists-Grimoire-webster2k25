import WellnessScore from "../Models/wellnessScoreModel.js";
import DoseLog from "../Models/doseLogModel.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";

// Helper: normalize & clamp metric to 0-100
const normalizeMetric = (v, fallback = 50) => {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
};

// Compute overall score from metrics object
const computeOverallScore = (metricsObj = {}) => {
  const keys = ["energy", "focus", "mood", "sleep", "vitality", "balance"];
  const vals = keys.map((k) => normalizeMetric(metricsObj[k], 50));
  const sum = vals.reduce((a, b) => a + b, 0);
  return vals.length ? Math.round(sum / vals.length) : 0;
};

// Update wellness metrics
export const updateWellnessMetrics = asyncHandler(async (req, res) => {
  const { metrics, notes, date } = req.body;
  const userId = req.user._id;

  if (!metrics || typeof metrics !== "object") {
    throw new ApiError(400, "Wellness metrics are required and must be an object");
  }

  // Normalize incoming metrics and ensure values 0-100
  const normalizedMetrics = {
    energy: normalizeMetric(metrics.energy),
    focus: normalizeMetric(metrics.focus),
    mood: normalizeMetric(metrics.mood),
    sleep: normalizeMetric(metrics.sleep),
    vitality: normalizeMetric(metrics.vitality),
    balance: normalizeMetric(metrics.balance),
  };

  const wellnessDate = date ? new Date(date) : new Date();
  wellnessDate.setHours(0, 0, 0, 0);

  // Calculate adherence for the day
  const endDate = new Date(wellnessDate);
  endDate.setHours(23, 59, 59, 999);

  const adherenceRate = await DoseLog.calculateAdherence(userId, wellnessDate, endDate);

  // Determine factors based on metrics and adherence
  const factors = [];
  if (adherenceRate >= 90) factors.push("all_doses_taken");
  if (adherenceRate < 50) factors.push("missed_doses");
  if (normalizedMetrics.sleep >= 80) factors.push("good_sleep");
  if (normalizedMetrics.sleep < 50) factors.push("poor_sleep");
  if (normalizedMetrics.energy >= 80) factors.push("exercise");
  if (normalizedMetrics.mood < 50) factors.push("stress");

  // compute overallScore here (controller-level)
  const overallScore = computeOverallScore(normalizedMetrics);

  // Create or update wellness score
  const wellnessScore = await WellnessScore.findOneAndUpdate(
    { userId, date: wellnessDate },
    {
      metrics: normalizedMetrics,
      adherenceRate,
      notes,
      factors,
      overallScore, // <-- included so validation won't fail on upsert
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      // setDefaultsOnInsert true may be helpful if you rely on schema defaults
      setDefaultsOnInsert: true,
    }
  );

  return res.status(200).json(
    new ApiResponse(200, wellnessScore, "Wellness updated successfully")
  );
});

// Get wellness history
export const getWellnessHistory = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days ?? "30", 10);
  const userId = req.user._id;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (Number.isNaN(days) ? 30 : days));
  startDate.setHours(0, 0, 0, 0); // include whole days from midnight

  const scores = await WellnessScore.find({
    userId,
    date: { $gte: startDate },
  }).sort({ date: -1 });

  // Calculate trends (keep using model's helper)
  const trend = await WellnessScore.getWellnessTrend(userId, Number.isNaN(days) ? 30 : days);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        scores,
        trend,
        average:
          scores.length > 0
            ? Math.round(scores.reduce((sum, s) => sum + (s.overallScore || 0), 0) / scores.length)
            : 0,
      },
      "Wellness history retrieved"
    )
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

    // default metrics (you can change defaults as needed)
    const defaultMetrics = {
      energy: 70,
      focus: 70,
      mood: 70,
      sleep: 70,
      vitality: 70,
      balance: 70,
    };

    // overallScore will be set by schema pre-save hook when using .create()
    wellness = await WellnessScore.create({
      userId,
      date: today,
      metrics: defaultMetrics,
      adherenceRate,
      factors: adherenceRate > 80 ? ["all_doses_taken"] : [],
    });
  }

  return res.status(200).json(new ApiResponse(200, wellness, "Today's wellness retrieved"));
});
