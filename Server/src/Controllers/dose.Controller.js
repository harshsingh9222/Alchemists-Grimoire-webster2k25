import DoseLog from "../Models/doseLogModel.js";
import Medicine from "../Models/medicineModel.js";
import WellnessScore from "../Models/wellnessScoreModel.js";
import Notification from "../Models/notificationModel.js";
import User from "../Models/user.models.js";
import Risk from '../Models/riskModel.js';
import nodemailer from 'nodemailer'
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { msFromISO, isNowWithinWindow, windowAroundNow } from "../Utils/time.helper.js";
import { localTimeToUTCDate } from "../Utils/timezone.helper.js";

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
    if (shouldTakeMedicine(medicine, date)) {
      for (const timeStr of medicine.times || []) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
          console.warn('Skipping invalid time string for medicine', medicine._id, timeStr);
          continue;
        }
        let scheduledTime;
        if (medicine.timezone) {
          scheduledTime = localTimeToUTCDate(date, timeStr, medicine.timezone);
        } else {
          scheduledTime = new Date(date);
          scheduledTime.setHours(hours, minutes, 0, 0);
        }

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
          await DoseLog.create({ userId: medicine.userId, medicineId: medicine._id, scheduledTime, status: 'pending', dayOfWeek: scheduledTime.getDay(), hour: scheduledTime.getHours() });
        }
      }
    }
  }
};

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

  // Server-side guard: prevent marking as 'taken' too early
  if (status === 'taken') {
    // If scheduledTime provided, enforce 15-minute pre-window using ms helper
    if (scheduledTime) {
  if (!isNowWithinWindow(scheduledTime, 15)) throw new ApiError(403, 'Too early to mark this dose as taken. You can mark it starting 15 minutes before scheduled time.');
    }
    // If no scheduledTime but doseId exists, we'll lookup the doseLog below and validate scheduledTime
  }

  if (doseId) {
    // Update existing dose log
    // If status is 'taken' and no scheduledTime provided in body, fetch the dose to check scheduledTime
    if (status === 'taken' && !scheduledTime) {
      const existing = await DoseLog.findOne({ _id: doseId, userId });
      if (!existing) {
        throw new ApiError(404, 'Dose log not found');
      }
      const scheduled = existing.scheduledTime;
      if (scheduled) {
  if (!isNowWithinWindow(scheduled, 15)) throw new ApiError(403, 'Too early to mark this dose as taken. You can mark it starting 15 minutes before scheduled time.');
      }
    }

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
  const scheduledMs = msFromISO(scheduledTime);
  if (scheduledMs === null) throw new ApiError(400, 'Invalid scheduledTime');

  // Build a +/- 30 minute search window using ms
  const windowStart = new Date(scheduledMs - 30 * 60 * 1000);
  const windowEnd = new Date(scheduledMs + 30 * 60 * 1000);

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
        confirmedBy: 'user',
        // ensure hour/dayOfWeek are present for analytics if inserting
        ...(status && scheduledMs ? { dayOfWeek: new Date(scheduledMs).getDay(), hour: new Date(scheduledMs).getHours() } : {})
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

// Core processing function for a given user (can be called by scheduler or endpoint)
export async function processPendingDosesForUser(userId) {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const pendingDoses = await DoseLog.find({ userId, status: 'pending', scheduledTime: { $lte: cutoff } }).populate('medicineId');

  // Also check for doses that are exactly ~30 minutes in the future to send a reminder
  const now = new Date();
  const thirtyMinMs = 30 * 60 * 1000;
  const toleranceMs = 180 * 1000; // +/- 3 minutes tolerance around 30 minutes
  const reminderWindowStart = new Date(now.getTime() + thirtyMinMs - toleranceMs);
  const reminderWindowEnd = new Date(now.getTime() + thirtyMinMs + toleranceMs);

    const upcomingReminders = await DoseLog.find({ userId, status: 'pending', scheduledTime: { $gte: reminderWindowStart, $lte: reminderWindowEnd } }).populate('medicineId');

    let transporter = null;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });

    const reminderResults = [];
    if (upcomingReminders && upcomingReminders.length > 0) {
      const reminderUser = await User.findById(userId);
      for (const dose of upcomingReminders) {
        try {
          const title = `Reminder: Upcoming dose in 30 minutes - ${dose.medicineId?.medicineName || 'Medicine'}`;
          const message = `You have a scheduled dose for ${dose.medicineId?.medicineName || 'your medicine'} at ${dose.scheduledTime.toLocaleString()}. This is a reminder 30 minutes before.`;
          const existing = await Notification.findOne({ relatedDoseLogId: dose._id, type: 'dose_reminder' });
          if (!existing) {
            await Notification.create({ userId, medicineId: dose.medicineId?._id || null, type: 'dose_reminder', title, message, priority: 'medium', read: false, actionRequired: false, actionType: null, relatedDoseLogId: dose._id, scheduledFor: dose.scheduledTime, sentAt: new Date() });
            if (transporter && reminderUser?.email) {
              try { await transporter.sendMail({ from: process.env.EMAIL_USER, to: reminderUser.email, subject: title, html: `<p>${message}</p>` }); } catch (mailErr) { console.warn('Failed to send 30-min reminder email:', mailErr?.message || mailErr); }
            }
            reminderResults.push({ doseId: dose._id, status: 'reminder_sent' });
          }
        } catch (err) { console.error('Error sending reminder for dose', dose._id, err); reminderResults.push({ doseId: dose._id, status: 'error', error: String(err) }); }
      }
    }

    if ((!pendingDoses || pendingDoses.length === 0) && reminderResults.length > 0) return { status: 200, body: { message: 'Processed reminders', reminderCount: reminderResults.length, reminders: reminderResults } };
    if (!pendingDoses || pendingDoses.length === 0) return { status: 200, body: { message: 'No pending doses to process', count: 0 } };

    const user = await User.findById(userId);
    const results = [];
    for (const dose of pendingDoses) {
      try {
        dose.status = 'missed';
        dose.actualTime = null;
        dose.confirmedBy = 'auto';
        await dose.save();
        const title = `Missed dose: ${dose.medicineId?.medicineName || 'Medicine'}`;
        const message = `You missed a scheduled dose for ${dose.medicineId?.medicineName || 'your medicine'} scheduled at ${dose.scheduledTime.toLocaleString()}`;
        const existingMissed = await Notification.findOne({ relatedDoseLogId: dose._id, type: 'missed_dose' });
        if (!existingMissed) await Notification.create({ userId, medicineId: dose.medicineId?._id || null, type: 'missed_dose', title, message, priority: 'high', read: false, actionRequired: false, actionType: null, relatedDoseLogId: dose._id, scheduledFor: dose.scheduledTime, sentAt: new Date() });
        if (transporter && user?.email) { try { await transporter.sendMail({ from: process.env.EMAIL_USER, to: user.email, subject: title, html: `<p>${message}</p>` }); } catch (mailErr) { console.warn('Failed to send missed-dose email:', mailErr?.message || mailErr); } }
        results.push({ doseId: dose._id, status: 'missed' });
      } catch (err) { console.error('Error processing pending dose', dose._id, err); results.push({ doseId: dose._id, status: 'error', error: String(err) }); }
    }

    await updateDailyAdherence(userId);
    return { status: 200, body: { message: 'Processed pending doses', count: results.length, details: results } };
  } catch (err) {
    console.error('processPendingDosesForUser error:', err);
    return { status: 500, body: { message: 'Error processing pending doses', error: String(err) } };
  }
}

// Check pending doses endpoint (calls core function)
export const checkPendingDoses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await processPendingDosesForUser(userId);
  return res.status(result.status || 200).json(result.body);
});

// Compute upcoming-dose missed probability for logged-in user
export const getUpcomingDoseRisks = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { start: windowStart, end: windowEnd } = windowAroundNow(30, 2);

    // Find upcoming dose logs for this user in the 30min window
    const upcoming = await DoseLog.find({
      userId,
      status: 'pending',
      scheduledTime: { $gte: windowStart, $lte: windowEnd }
    }).populate('medicineId');

    const slots = [
      { id: 0, start: 0, end: 6, label: '00:00-06:00' },
      { id: 1, start: 6, end: 12, label: '06:00-12:00' },
      { id: 2, start: 12, end: 18, label: '12:00-18:00' },
      { id: 3, start: 18, end: 24, label: '18:00-24:00' },
    ];

    // Build compact recent logs JSON once (last 30 days, limited fields and capped to 300 entries)
    const lookbackDays = 30;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);
    since.setHours(0, 0, 0, 0);

    const recentLogsFull = await DoseLog.find({ userId, scheduledTime: { $gte: since } })
      .select('scheduledTime status hour dayOfWeek medicineId')
      .sort({ scheduledTime: -1 })
      .limit(300)
      .lean();

    const recentLogs = recentLogsFull.map(l => ({
      scheduledTime: l.scheduledTime,
      status: l.status,
      hour: l.hour,
      dayOfWeek: l.dayOfWeek,
      medicineId: l.medicineId?.toString?.() || String(l.medicineId)
    })).reverse(); // oldest first

    const openaiKey = process.env.OPENAI_API_KEY;
    const useAI = Boolean(openaiKey) && typeof fetch === 'function';

    for (const dose of upcoming) {
      const hr = dose.hour != null ? dose.hour : (dose.scheduledTime ? dose.scheduledTime.getHours() : null);
      const slot = slots.find(s => hr >= s.start && hr < s.end) || slots[0];

      let willMiss = false;
      let confidence = 0;

      if (useAI) {
        try {
          const payload = {
            upcomingDose: {
              medicineId: dose.medicineId?._id?.toString?.() || String(dose.medicineId?._id || ''),
              medicineName: dose.medicineId?.medicineName || 'Medicine',
              scheduledTime: dose.scheduledTime,
              hour: hr,
              dayOfWeek: dose.dayOfWeek ?? (dose.scheduledTime ? dose.scheduledTime.getDay() : null),
              slot: slot.label
            },
            recentLogs
          };

          console.log('[AI] Sending OpenAI risk request', {
            doseId: String(dose._id),
            medicine: payload.upcomingDose.medicineName,
            scheduledTime: payload.upcomingDose.scheduledTime
          });

          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0,
              max_tokens: 100,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: 'You are a concise classifier. Given dose logs and an upcoming dose, predict if the user will miss it. Respond ONLY as JSON: {"will_miss": boolean, "confidence": number} where confidence is 0..1.' },
                { role: 'user', content: `Classify risk for upcoming dose using this data:\n${JSON.stringify(payload)}` }
              ]
            })
          });
          if (resp.ok) {
            console.log('[AI] OpenAI risk classification success', {
              doseId: String(dose._id),
              status: resp.status
            });
            const data = await resp.json();
            const text = data?.choices?.[0]?.message?.content || '{}';
            try {
              const parsed = JSON.parse(text);
              willMiss = Boolean(parsed.will_miss);
              const c = Number(parsed.confidence);
              confidence = Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0;
            } catch (_) {
              // fallback: leave defaults
            }
          } else {
            console.warn('[AI] OpenAI risk classification non-OK response', {
              doseId: String(dose._id),
              status: resp.status
            });
          }
        } catch (aiErr) {
          console.warn('OpenAI risk classification failed:', aiErr?.message || aiErr);
        }
      }

      const riskDetails = {
        medicineName: dose.medicineId?.medicineName || 'Medicine',
        scheduledTime: dose.scheduledTime,
        willMiss,
        confidence,
        slot: slot.label,
        source: useAI ? 'ai' : 'fallback'
      };

      const existingRisk = await Risk.findOne({ doseLogId: dose._id });
      if (!existingRisk) {
        const sendAt = new Date(Date.now() + 2 * 60 * 1000);
        await Risk.create({
          userId,
          doseId: dose.medicineId?._id,
          doseLogId: dose._id,
          riskDetails,
          sent: false,
          timeAtWhichSent: sendAt,
        });

        console.log('[Risk] New risk scheduled', {
          userId: String(userId),
          doseLogId: String(dose._id),
          doseId: String(dose.medicineId?._id || ''),
          medicine: riskDetails.medicineName,
          willMiss,
          confidence,
          sendAt: sendAt.toISOString(),
        });
      }
    }

    // After adding risks, fetch this user's unsent risks that are due now:
    // sent=false and timeAtWhichSent in the last 5 minutes up to now (wider window to avoid missed polls)
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const dueRiskDocs = await Risk.find({
      userId,
      sent: false,
      timeAtWhichSent: { $gte: fiveMinAgo, $lte: now }
    })
      .sort({ timeAtWhichSent: 1 })
      .lean();

    // Mark these risks as sent before returning to frontend to avoid duplicates on next poll
    const dueIds = dueRiskDocs.map(r => r._id).filter(Boolean);
    if (dueIds.length > 0) {
      const updateResult = await Risk.updateMany({ _id: { $in: dueIds }, sent: false }, { $set: { sent: true } });
      console.log('[Risk] Marked risks as sent', {
        userId: String(userId),
        requested: dueIds.length,
        matched: updateResult?.matchedCount ?? updateResult?.nMatched,
        modified: updateResult?.modifiedCount ?? updateResult?.nModified,
      });
    }

    const dueRisks = dueRiskDocs.map((doc) => {
      const details = doc.riskDetails || {};
      const willMissDoc = Boolean(details.willMiss);
      const confDoc = Number(details.confidence) || 0;
      return {
        doseId: doc.doseLogId,
        medicineName: details.medicineName || 'Medicine',
        scheduledTime: details.scheduledTime,
        willMiss: willMissDoc,
        confidence: confDoc,
        missedProb: willMissDoc ? (confDoc || 1) : 0,
        slot: details.slot,
        sent: true,
      };
    });

    console.log('[Risk] Returning due risks (marked sent)', {
      dueRiskDocs,
      userId: String(userId),
      count: dueRiskDocs.length,
      windowStart: fiveMinAgo.toISOString(),
      windowEnd: now.toISOString(),
    });

    return res.status(200).json({ risks: dueRisks });
  } catch (err) {
    console.error('getUpcomingDoseRisks error', err);
    return res.status(500).json({ message: 'Failed to compute upcoming risks', error: String(err) });
  }
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

// ========================================
// controllers/doseController.js
// ========================================

/**
 * Get user dose data summary for chatbot
 * This function will return:
 * - Recent 7 days of doses
 * - Count of taken, missed, and pending doses
 * - List of upcoming doses
 */
export const getUserDoseData = async (userId) => {
  try {
    // 1️⃣ Fetch last 7 days of dose logs
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const recentLogs = await DoseLog.find({
      userId,
      scheduledTime: { $gte: startDate },
    })
      .populate("medicineId", "medicineName dosage frequency") // assuming Medicine model has these
      .sort({ scheduledTime: 1 })
      .lean();

      console.log("Recent log in the calling the function to the AI->",recentLogs);
    if (!recentLogs.length) {
      return {
        message: "No recent dose data found for this user.",
        summary: {},
      };
    }

    // 2️⃣ Categorize doses by status
    const summary = {
      total: recentLogs.length,
      taken: 0,
      missed: 0,
      pending: 0,
      skipped: 0,
    };

    const upcoming = [];
    const pastDoses = [];

    const now = new Date();

    for (const log of recentLogs) {
      summary[log.status] = (summary[log.status] || 0) + 1;

      const doseInfo = {
        medicineName: log.medicineId?.medicineName || "Unknown",
        dosage: log.medicineId?.dosage,
        time: log.scheduledTime,
        status: log.status,
      };


      if (log.scheduledTime > now) upcoming.push(doseInfo);
      else pastDoses.push(doseInfo);
    }

    return {
      summary,
      recentLogs: pastDoses.slice(-10), // last 10 taken/missed
      upcomingDoses: upcoming.slice(0, 5),
    };
  } catch (error) {
    console.error("Error fetching dose data:", error);
    throw new Error("Failed to retrieve user dose data");
  }
};

// Schedule a new reminder risk 10 minutes from now for a given doseLogId
export const remindRiskAgain = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { doseLogId } = req.body || {};
    if (!doseLogId) {
      throw new ApiError(400, 'doseLogId is required');
    }

    // Try to reuse last risk details if available
    const lastRisk = await Risk.findOne({ userId, doseLogId }).sort({ createdAt: -1 });

    let riskDetails = lastRisk?.riskDetails;
    let doseId = lastRisk?.doseId || null;
    if (!riskDetails || !doseId) {
      // Fallback: fetch dose log and medicine to build minimal details
      const dose = await DoseLog.findOne({ _id: doseLogId, userId }).populate('medicineId');
      if (!dose) throw new ApiError(404, 'Dose log not found');
      const hr = dose.hour != null ? dose.hour : (dose.scheduledTime ? dose.scheduledTime.getHours() : null);
      const slots = [
        { id: 0, start: 0, end: 6, label: '00:00-06:00' },
        { id: 1, start: 6, end: 12, label: '06:00-12:00' },
        { id: 2, start: 12, end: 18, label: '12:00-18:00' },
        { id: 3, start: 18, end: 24, label: '18:00-24:00' },
      ];
      const slot = slots.find(s => hr >= s.start && hr < s.end) || slots[0];
      riskDetails = {
        medicineName: dose.medicineId?.medicineName || 'Medicine',
        scheduledTime: dose.scheduledTime,
        willMiss: lastRisk?.riskDetails?.willMiss ?? false,
        confidence: lastRisk?.riskDetails?.confidence ?? 0,
        slot: slot.label,
        source: 'manual-remind'
      };
      doseId = dose.medicineId?._id || null;
    }

    const sendAt = new Date(Date.now() + 10 * 60 * 1000);
    const created = await Risk.create({
      userId,
      doseId,
      doseLogId,
      riskDetails,
      sent: false,
      timeAtWhichSent: sendAt,
    });

    console.log('[Risk] Remind-again scheduled', {
      userId: String(userId),
      doseLogId: String(doseLogId),
      riskId: String(created._id),
      sendAt: sendAt.toISOString(),
    });

    return res.status(200).json(new ApiResponse(200, { riskId: created._id, sendAt }, 'Reminder scheduled'));
  } catch (err) {
    console.error('remindRiskAgain error', err);
    return res.status(500).json({ message: 'Failed to schedule reminder', error: String(err) });
  }
});

