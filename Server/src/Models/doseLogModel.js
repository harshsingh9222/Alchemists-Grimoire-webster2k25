// ========================================
import mongoose from "mongoose";

const doseLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
    actualTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "taken", "missed", "skipped"],
      default: "pending",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Track if reminder was sent
    reminderSent: {
      type: Boolean,
      default: false,
    },
    // Track method of confirmation
    confirmedBy: {
      type: String,
      enum: ["user", "caregiver", "auto", null],
      default: null,
    },
    // For pattern detection
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday)
      required: true,
    },
    hour: {
      type: Number, // 0-23
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
doseLogSchema.index({ userId: 1, scheduledTime: -1 });
doseLogSchema.index({ userId: 1, status: 1 });
doseLogSchema.index({ medicineId: 1, scheduledTime: -1 });

// Method to calculate adherence rate
doseLogSchema.statics.calculateAdherence = async function(userId, startDate, endDate) {
  const logs = await this.find({
    userId,
    scheduledTime: { $gte: startDate, $lte: endDate },
    status: { $in: ["taken", "missed"] }
  });
  
  if (logs.length === 0) return 100;
  
  const takenCount = logs.filter(log => log.status === "taken").length;
  return Math.round((takenCount / logs.length) * 100);
};

// Method to get pattern insights
doseLogSchema.statics.getPatternInsights = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const logs = await this.find({
    userId,
    scheduledTime: { $gte: startDate },
    status: { $in: ["taken", "missed"] }
  });
  
  // Analyze by day of week
  const dayPattern = {};
  const hourPattern = {};
  
  logs.forEach(log => {
    // Day analysis
    if (!dayPattern[log.dayOfWeek]) {
      dayPattern[log.dayOfWeek] = { taken: 0, missed: 0 };
    }
    dayPattern[log.dayOfWeek][log.status]++;
    
    // Hour analysis
    if (!hourPattern[log.hour]) {
      hourPattern[log.hour] = { taken: 0, missed: 0 };
    }
    hourPattern[log.hour][log.status]++;
  });
  
  // Find problematic times
  const problematicDays = [];
  const problematicHours = [];
  
  Object.entries(dayPattern).forEach(([day, stats]) => {
    const adherence = (stats.taken / (stats.taken + stats.missed)) * 100;
    if (adherence < 70) {
      problematicDays.push({ day: parseInt(day), adherence });
    }
  });
  
  Object.entries(hourPattern).forEach(([hour, stats]) => {
    const adherence = (stats.taken / (stats.taken + stats.missed)) * 100;
    if (adherence < 70) {
      problematicHours.push({ hour: parseInt(hour), adherence });
    }
  });
  
  return { problematicDays, problematicHours, dayPattern, hourPattern };
};

const DoseLog = mongoose.model("DoseLog", doseLogSchema);

export default DoseLog;