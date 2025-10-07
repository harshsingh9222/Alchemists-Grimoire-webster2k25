import mongoose from "mongoose";

const wellnessScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    // Individual metrics (0-100 scale)
    metrics: {
      energy: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      focus: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      mood: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      sleep: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      vitality: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      balance: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
    },
    // Overall wellness score (calculated)
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    // Adherence rate for the day
    adherenceRate: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    // Notes or observations
    notes: {
      type: String,
      trim: true,
    },
    // Factors that might have affected wellness
    factors: [{
      type: String,
      enum: [
        "missed_doses",
        "all_doses_taken",
        "good_sleep",
        "poor_sleep",
        "stress",
        "exercise",
        "good_diet",
        "poor_diet",
        "side_effects"
      ],
    }],
  },
  { timestamps: true }
);

// Index for efficient queries
wellnessScoreSchema.index({ userId: 1, date: -1 });

// Calculate overall score before saving
wellnessScoreSchema.pre("save", function(next) {
  const metrics = this.metrics;
  const metricValues = Object.values(metrics);
  const sum = metricValues.reduce((acc, val) => acc + val, 0);
  this.overallScore = Math.round(sum / metricValues.length);
  next();
});

// Get wellness trend
wellnessScoreSchema.statics.getWellnessTrend = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const scores = await this.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });
  
  if (scores.length < 2) return { trend: 0, improvement: "stable" };
  
  // Calculate trend
  const recentAvg = scores.slice(-3).reduce((sum, s) => sum + s.overallScore, 0) / 3;
  const oldAvg = scores.slice(0, 3).reduce((sum, s) => sum + s.overallScore, 0) / 3;
  const trend = recentAvg - oldAvg;
  
  let improvement;
  if (trend > 5) improvement = "improving";
  else if (trend < -5) improvement = "declining";
  else improvement = "stable";
  
  return { trend: Math.round(trend), improvement, currentScore: scores[scores.length - 1].overallScore };
};

const WellnessScore = mongoose.model("WellnessScore", wellnessScoreSchema);

export default WellnessScore;