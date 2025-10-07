import DoseLog from "../Models/doseLogModel.js";
import Medicine from "../Models/medicineModel.js";
import WellnessScore from "../Models/wellnessScoreModel.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";

// Get doses for a specific date
export const getDosesByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const userId = req.user._id;
  
  if (!date) {
    throw new ApiError(400, "Date is required");
  }
  
  // Parse the date and set time boundaries
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  // Check if dose logs exist for this date, if not create them
  const existingLogs = await DoseLog.find({
    userId,
    scheduledTime: { $gte: startDate, $lte: endDate }
  });
  
  // If no logs exist and date is today or future, create them
  if (existingLogs.length === 0 && startDate >= new Date().setHours(0, 0, 0, 0)) {
    await createDoseLogsForDate(userId, startDate);
  }
  
  // Fetch dose logs with medicine details
  const doses = await DoseLog.find({
    userId,
    scheduledTime: { $gte: startDate, $lte: endDate }
  })
  .populate('medicineId', 'medicineName dosage frequency notes')
  .sort({ scheduledTime: 1 });
  
  // Format doses for frontend
  const formattedDoses = doses.map(dose => ({
    _id: dose._id,
    medicineId: dose.medicineId._id,
    medicineName: dose.medicineId.medicineName,
    dosage: dose.medicineId.dosage,
    time: dose.scheduledTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    scheduledTime: dose.scheduledTime,
    actualTime: dose.actualTime,
    status: dose.status,
    notes: dose.notes
  }));
  
  return res.status(200).json(
    new ApiResponse(200, formattedDoses, "Doses retrieved successfully")
  );
});

// Helper function to create dose logs for a specific date
const createDoseLogsForDate = async (userId, date) => {
  const medicines = await Medicine.find({
    userId,
    $or: [
      { endDate: null },
      { endDate: { $gte: date } }
    ],
    startDate: { $lte: date }
  });
  
  for (const medicine of medicines) {
    // Check if this medicine should be taken on this date
    if (shouldTakeMedicine(medicine, date)) {
      for (const timeStr of medicine.times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledTime = new Date(date);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // Check if log already exists
        const existingLog = await DoseLog.findOne({
          userId: medicine.userId,
          medicineId: medicine._id,
          scheduledTime: {
            $gte: new Date(scheduledTime).setSeconds(0, 0),
            $lt: new Date(scheduledTime).setSeconds(59, 999)
          }
        });
        
        if (!existingLog) {
          await DoseLog.create({
            userId: medicine.userId,
            medicineId: medicine._id,
            scheduledTime,
            status: 'pending',
            dayOfWeek: scheduledTime.getDay(),
            hour: scheduledTime.getHours()
          });
        }
      }
    }
  }
};

// Helper to check if medicine should be taken on a date
const shouldTakeMedicine = (medicine, date) => {
  if (medicine.frequency === 'daily') return true;
  
  if (medicine.frequency === 'weekly') {
    const startDay = new Date(medicine.startDate).getDay();
    const checkDay = date.getDay();
    return startDay === checkDay;
  }
  
  if (medicine.frequency === 'as-needed') return false;
  
  return true;
};

// Mark dose as taken/skipped/missed
export const updateDoseStatus = asyncHandler(async (req, res) => {
  const { doseId, medicineId, scheduledTime, status, notes } = req.body;
  const userId = req.user._id;
  
  let doseLog;
  
  if (doseId) {
    // Update existing dose log
    doseLog = await DoseLog.findOneAndUpdate(
      { _id: doseId, userId },
      {
        status,
        actualTime: status === 'taken' ? new Date() : null,
        notes: notes || undefined,
        confirmedBy: 'user'
      },
      { new: true }
    );
  } else if (medicineId && scheduledTime) {
    // Create or update dose log
    const scheduled = new Date(scheduledTime);
    
    doseLog = await DoseLog.findOneAndUpdate(
      {
        userId,
        medicineId,
        scheduledTime: {
          $gte: new Date(scheduled).setMinutes(scheduled.getMinutes() - 30),
          $lte: new Date(scheduled).setMinutes(scheduled.getMinutes() + 30)
        }
      },
      {
        status,
        actualTime: status === 'taken' ? new Date() : null,
        notes: notes || undefined,
        confirmedBy: 'user'
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );
  } else {
    throw new ApiError(400, "Either doseId or medicineId with scheduledTime required");
  }
  
  if (!doseLog) {
    throw new ApiError(404, "Dose log not found");
  }
  
  // Update today's adherence in wellness score
  await updateDailyAdherence(userId);
  
  return res.status(200).json(
    new ApiResponse(200, doseLog, `Dose marked as ${status}`)
  );
});

// Get dose history
export const getDoseHistory = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const userId = req.user._id;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);
  
  const doses = await DoseLog.find({
    userId,
    scheduledTime: { $gte: startDate }
  })
  .populate('medicineId', 'medicineName')
  .sort({ scheduledTime: -1 });
  
  return res.status(200).json(
    new ApiResponse(200, doses, "Dose history retrieved")
  );
});

// Helper to update daily adherence
const updateDailyAdherence = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const adherenceRate = await DoseLog.calculateAdherence(userId, today, tomorrow);
  
  await WellnessScore.findOneAndUpdate(
    { userId, date: today },
    { adherenceRate },
    { upsert: true }
  );
};