import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";
import Medicine from "../Models/medicineModel.js";
import DoseLog from "../Models/doseLogModel.js";
import WellnessScore from "../Models/wellnessScoreModel.js";
import { createDoseLogsForMedicine } from "../Utils/doseLogCreater.js";
import { localTimeToUTCDate } from "../Utils/timezone.helper.js";

dotenv.config();

// Helper: ensure database connection. If mongoose is already connected (e.g. server start), reuse it.
const ensureConnected = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('initializeUserData: mongoose already connected, reusing connection')
    return { connected: false }
  }

  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log('initializeUserData: connected to MongoDB for data initialization')
    return { connected: true }
  } catch (err) {
    console.error('initializeUserData: failed to connect to DB:', err)
    throw err
  }
}

// Initialize dose logs for existing medicines
const initializeDoseLogs = async (userId) => {
  try {
    console.log("🔄 Initializing dose logs for existing medicines...");
    
    // Get all active medicines
    const medicines = await Medicine.find({
      userId,
      $or: [
        { endDate: null },
        { endDate: { $gte: new Date() } }
      ]
    });
    
    console.log(`Found ${medicines.length} active medicines`);
    
    for (const medicine of medicines) {
      await createDoseLogsForMedicine(medicine, userId);
    }
    
    // Create some historical dose logs with varied statuses for testing
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const medicine of medicines) {
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        for (const timeStr of medicine.times) {
          let scheduledTime;
          if (medicine.timezone) {
            scheduledTime = localTimeToUTCDate(date, timeStr, medicine.timezone);
          } else {
            const [hours, minutes] = timeStr.split(':');
            scheduledTime = new Date(date);
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
          
          // Random status for historical data
          const statuses = ['taken', 'taken', 'taken', 'missed']; // 75% adherence
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          const sStart = new Date(scheduledTime);
          sStart.setSeconds(0, 0);
          const sEnd = new Date(scheduledTime);
          sEnd.setSeconds(59, 999);

          await DoseLog.findOneAndUpdate(
            {
              userId,
              medicineId: medicine._id,
              scheduledTime: {
                $gte: sStart,
                $lt: sEnd
              }
            },
            {
              userId,
              medicineId: medicine._id,
              scheduledTime,
              status: randomStatus,
              actualTime: randomStatus === 'taken' ? scheduledTime : null,
              dayOfWeek: scheduledTime.getDay(),
              hour: scheduledTime.getHours(),
              confirmedBy: 'auto'
            },
            { upsert: true }
          );
        }
      }
    }
    
    console.log("✅ Dose logs initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing dose logs:", error);
  }
};

// Initialize wellness scores
const initializeWellnessScores = async (userId) => {
  try {
    console.log("🔄 Initializing wellness scores...");
    
    // Create wellness scores for the past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Calculate actual adherence for this day
      const adherenceRate = await DoseLog.calculateAdherence(userId, date, endDate);
      
      // Generate realistic metrics based on adherence
      const baseScore = 60;
      const adherenceBonus = adherenceRate * 0.3;
      const randomVariation = () => Math.random() * 10 - 5;
      
      const metrics = {
        energy: Math.min(100, Math.max(0, baseScore + adherenceBonus + randomVariation())),
        focus: Math.min(100, Math.max(0, baseScore + adherenceBonus + randomVariation())),
        mood: Math.min(100, Math.max(0, baseScore + adherenceBonus + randomVariation())),
        sleep: Math.min(100, Math.max(0, baseScore + 15 + randomVariation())),
        vitality: Math.min(100, Math.max(0, baseScore + adherenceBonus + randomVariation())),
        balance: Math.min(100, Math.max(0, baseScore + adherenceBonus + randomVariation()))
      };
      
      const factors = [];
      if (adherenceRate >= 90) factors.push('all_doses_taken');
      if (adherenceRate < 50) factors.push('missed_doses');
      if (metrics.sleep >= 80) factors.push('good_sleep');
      
      await WellnessScore.findOneAndUpdate(
        { userId, date },
        {
          metrics,
          adherenceRate,
          factors,
          notes: i === 0 ? "Feeling great today!" : null
        },
        { upsert: true }
      );
    }
    
    console.log("✅ Wellness scores initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing wellness scores:", error);
  }
};

// Main initialization function
export const initializeUserData = async (userId) => {
  let connInfo = null
  try {
    connInfo = await ensureConnected();
    await initializeDoseLogs(userId);
    await initializeWellnessScores(userId);
    console.log("🎉 Data initialization completed successfully!");
  } catch (error) {
    console.error("❌ Data initialization failed:", error);
  } finally {
    // Only disconnect if this script opened a fresh connection
    try {
      if (connInfo && connInfo.connected) {
        await mongoose.disconnect();
        console.log('initializeUserData: disconnected DB after initialization')
      }
    } catch (e) {
      // if we didn't start the connection, do not close it
    }
  }
};

// If running as script
if (process.argv[2]) {
  const userId = process.argv[2];
  initializeUserData(userId);
}