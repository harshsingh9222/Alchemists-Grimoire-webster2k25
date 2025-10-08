import DoseLog from "../Models/doseLogModel.js";
import Medicine from "../Models/medicineModel.js";
import WellnessScore from "../Models/wellnessScoreModel.js";
import Notification from "../Models/notificationModel.js";
import User from "../Models/user.models.js";
import nodemailer from 'nodemailer'
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";

// Get doses for a specific date
export const getDosesByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const userId = req.user._id;

  console.log("Requested date for doses:", date);
  if (!date) {
    throw new ApiError(400, 'Date is required');
  }

  // Parse YYYY-MM-DD into local start and end Date objects (start inclusive, end exclusive)
  const parts = date.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  }
  const [year, month, day] = parts;

  // Local midnight for start (inclusive)
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  // Next day local midnight for exclusive end
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  // Debug logging
  console.log('getDosesByDate - user:', String(userId), 'search between', startDate.toISOString(), 'and', endDate.toISOString());

  // Check if dose logs exist for this date, if not create them
  const existingLogs = await DoseLog.find({
    userId,
    scheduledTime: { $gte: startDate, $lt: endDate }
  });

  console.log(`Existing dose logs for ${date}: count=${existingLogs.length}`);

  // If no logs exist and date is today or future, create them
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (existingLogs.length === 0 && startDate >= todayStart) {
    await createDoseLogsForDate(userId, startDate);
  }

  // Fetch dose logs with medicine details (use $lt for exclusive end)
  const doses = await DoseLog.find({
    userId,
    scheduledTime: { $gte: startDate, $lt: endDate }
  })
    .populate('medicineId', 'medicineName dosage frequency notes')
    .sort({ scheduledTime: 1 });

  // Format doses for frontend with safe optional chaining
  const formattedDoses = doses.map(dose => {
    const med = dose.medicineId || {};
    return {
      _id: dose._id,
      medicineId: med._id ?? null,
      medicineName: med.medicineName ?? "Unknown",
      dosage: med.dosage ?? null,
      time: dose.scheduledTime
        ? dose.scheduledTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        : null,
      scheduledTime: dose.scheduledTime,
      actualTime: dose.actualTime,
      status: dose.status,
      notes: dose.notes
    };
  });

  console.log("Doses from the today Doses call ->", formattedDoses);

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
      for (const timeStr of medicine.times || []) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
          console.warn('Skipping invalid time string for medicine', medicine._id, timeStr);
          continue;
        }
        const scheduledTime = new Date(date);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Look for existing log in the same minute window (use Date objects)
        const scheduledStart = new Date(scheduledTime);
        scheduledStart.setSeconds(0, 0);
        const scheduledEnd = new Date(scheduledTime);
        scheduledEnd.setSeconds(59, 999);

        const existingLog = await DoseLog.findOne({
          userId: medicine.userId,
          medicineId: medicine._id,
          scheduledTime: {
            $gte: scheduledStart,
            $lte: scheduledEnd
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
  if (!medicine) return false;
  if (medicine.frequency === 'daily') return true;

  if (medicine.frequency === 'weekly') {
    // If the medicine has an array of days e.g. [1,3,5] prefer that; else fallback to startDate's weekday
    if (Array.isArray(medicine.days) && medicine.days.length > 0) {
      const checkDay = date.getDay();
      return medicine.days.includes(checkDay);
    }
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

    // Build a +/- 30 minute search window using Date objects
    const windowStart = new Date(scheduled.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(scheduled.getTime() + 30 * 60 * 1000);

    doseLog = await DoseLog.findOneAndUpdate(
      {
        userId,
        medicineId,
        scheduledTime: {
          $gte: windowStart,
          $lte: windowEnd
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

// Check pending doses older than 30 minutes and mark them as missed + notify user
export const checkPendingDoses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // cutoff: scheduledTime <= now - 30 minutes
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const pendingDoses = await DoseLog.find({ userId, status: 'pending', scheduledTime: { $lte: cutoff } }).populate('medicineId');

  // Also check for doses that are exactly ~30 minutes in the future to send a reminder
  const now = new Date();
  const thirtyMinMs = 30 * 60 * 1000;
  const toleranceMs = 180 * 1000; // +/- 3 minutes tolerance around 30 minutes
  const reminderWindowStart = new Date(now.getTime() + thirtyMinMs - toleranceMs);
  const reminderWindowEnd = new Date(now.getTime() + thirtyMinMs + toleranceMs);

  const upcomingReminders = await DoseLog.find({
    userId,
    status: 'pending',
    scheduledTime: { $gte: reminderWindowStart, $lte: reminderWindowEnd }
  }).populate('medicineId');

  // Prepare email transporter once for reminders and missed emails
  let transporter = null;
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }

  // Send reminders for upcoming doses (scheduled ~30 minutes from now)
  const reminderResults = [];
  if (upcomingReminders && upcomingReminders.length > 0) {
    const reminderUser = await User.findById(userId);
    for (const dose of upcomingReminders) {
      try {
        const title = `Reminder: Upcoming dose in 30 minutes - ${dose.medicineId?.medicineName || 'Medicine'}`;
        const message = `You have a scheduled dose for ${dose.medicineId?.medicineName || 'your medicine'} at ${dose.scheduledTime.toLocaleString()}. This is a reminder 30 minutes before.`;

        await Notification.create({
          userId,
          medicineId: dose.medicineId?._id || null,
          type: 'dose_reminder',
          title,
          message,
          priority: 'medium',
          read: false,
          actionRequired: false,
          actionType: null,
          relatedDoseLogId: dose._id,
          scheduledFor: dose.scheduledTime,
          sentAt: new Date()
        });

        if (transporter && reminderUser?.email) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: reminderUser.email,
              subject: title,
              html: `<p>${message}</p>`
            });
          } catch (mailErr) {
            console.warn('Failed to send 30-min reminder email:', mailErr?.message || mailErr);
          }
        }

        reminderResults.push({ doseId: dose._id, status: 'reminder_sent' });
      } catch (err) {
        console.error('Error sending reminder for dose', dose._id, err);
        reminderResults.push({ doseId: dose._id, status: 'error', error: String(err) });
      }
    }
  }

  // If there were no overdue pending doses but we did send reminders, return that info
  if ((!pendingDoses || pendingDoses.length === 0) && reminderResults.length > 0) {
    return res.status(200).json({ message: 'Processed reminders', reminderCount: reminderResults.length, reminders: reminderResults });
  }

  if (!pendingDoses || pendingDoses.length === 0) {
    return res.status(200).json({ message: 'No pending doses to process', count: 0 });
  }

  const user = await User.findById(userId);
  const results = [];

  for (const dose of pendingDoses) {
    try {
      // update doseLog as missed
      dose.status = 'missed';
      dose.actualTime = null;
      dose.confirmedBy = 'auto';
      await dose.save();

      // create notification
      const title = `Missed dose: ${dose.medicineId?.medicineName || 'Medicine'}`;
      const message = `You missed a scheduled dose for ${dose.medicineId?.medicineName || 'your medicine'} scheduled at ${dose.scheduledTime.toLocaleString()}`;

      await Notification.create({
        userId,
        medicineId: dose.medicineId?._id || null,
        type: 'missed_dose',
        title,
        message,
        priority: 'high',
        read: false,
        actionRequired: false,
        actionType: null,
        relatedDoseLogId: dose._id,
        scheduledFor: dose.scheduledTime,
        sentAt: new Date()
      });

      // send email if transporter available
      if (transporter && user?.email) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: title,
            html: `<p>${message}</p>`
          });
        } catch (mailErr) {
          console.warn('Failed to send missed-dose email:', mailErr?.message || mailErr);
        }
      }

      results.push({ doseId: dose._id, status: 'missed' });
    } catch (err) {
      console.error('Error processing pending dose', dose._id, err);
      results.push({ doseId: dose._id, status: 'error', error: String(err) });
    }
  }

  // update adherence metrics after changes
  await updateDailyAdherence(userId);

  return res.status(200).json({ message: 'Processed pending doses', count: results.length, details: results });
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
