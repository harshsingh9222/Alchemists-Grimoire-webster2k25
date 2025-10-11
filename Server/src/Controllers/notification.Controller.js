import Notification from "../Models/notificationModel.js";
import DoseLog from "../Models/doseLogModel.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";

// GET /notifications?date=YYYY-MM-DD
export const getNotificationsForDate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { date } = req.query;

  if (!date) throw new ApiError(400, 'Date query parameter is required in YYYY-MM-DD format');

  const parts = date.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  const [year, month, day] = parts;

  // Use local date boundaries (consistent with /doses/by-date)
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  // 1) Sent notifications for that date (sentAt not null and scheduledFor inside the date)
  // Only return sent notifications that are still unread and not acknowledged
  const sent = await Notification.find({
    userId,
    sentAt: { $ne: null },
    scheduledFor: { $gte: startDate, $lt: endDate },
    read: false,
  }).sort({ scheduledFor: -1 }).lean();

  // 2) Upcoming reminders derived from DoseLog for the requested date.
  // Return pending DoseLogs for that date so frontend can show "reminder-like" items.
  const pendingDoseLogs = await DoseLog.find({
    userId,
    status: 'pending',
    scheduledTime: { $gte: startDate, $lt: endDate }
  })
    .populate('medicineId', 'medicineName')
    .sort({ scheduledTime: 1 })
    .lean();

  const upcoming = (pendingDoseLogs || []).map((d) => ({
    _id: d._id,
    type: 'dose_reminder',
    medicineId: d.medicineId?._id || null,
    medicineName: d.medicineId?.medicineName || 'Medicine',
    scheduledFor: d.scheduledTime,
    relatedDoseLogId: d._id,
    title: `Upcoming dose: ${d.medicineId?.medicineName || 'Medicine'}`,
    message: `Scheduled at ${d.scheduledTime ? new Date(d.scheduledTime).toLocaleTimeString() : 'unknown'}`,
  }));

  return res.status(200).json(new ApiResponse(200, { sent, upcoming }, 'Notifications retrieved'));
});

// Mark notifications as read for a user. Accepts array of notification ids in body.ids
export const markNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { ids } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    // If no ids provided, mark all notifications for the day as read? For safety, return 400
    throw new ApiError(400, 'ids array is required');
  }

  const result = await Notification.updateMany({ _id: { $in: ids }, userId }, { $set: { read: true } });
  return res.status(200).json(new ApiResponse(200, { matched: result?.matchedCount ?? result?.n ?? 0 }, 'Notifications marked read'));
});

// Acknowledge a single notification (mark actionRequired false and set acknowledgedAt)
export const acknowledgeNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.body || {};
  if (!id) throw new ApiError(400, 'id is required');

  const note = await Notification.findOneAndUpdate({ _id: id, userId }, { $set: { actionRequired: false, read: true, acknowledgedAt: new Date() } }, { new: true }).lean();
  if (!note) throw new ApiError(404, 'Notification not found');
  return res.status(200).json(new ApiResponse(200, note, 'Notification acknowledged'));
});

// Convert an upcoming DoseLog into a Notification document (create reminder notification)
export const convertDoseLogToNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { doseLogId } = req.body || {};
  if (!doseLogId) throw new ApiError(400, 'doseLogId is required');

  const dose = await DoseLog.findOne({ _id: doseLogId, userId }).populate('medicineId');
  if (!dose) throw new ApiError(404, 'Dose log not found');

  // Use atomic upsert to avoid race conditions (create if missing)
  const filter = { relatedDoseLogId: dose._id, type: 'dose_reminder' };
  const toInsert = {
    userId,
    medicineId: dose.medicineId?._id || null,
    type: 'dose_reminder',
    title: `Reminder: ${dose.medicineId?.medicineName || 'Medicine'}`,
    message: `Scheduled at ${dose.scheduledTime ? new Date(dose.scheduledTime).toLocaleTimeString() : 'unknown'}`,
    priority: 'medium',
    read: false,
    actionRequired: true,
    actionType: 'take_dose',
    relatedDoseLogId: dose._id,
    scheduledFor: dose.scheduledTime,
    sentAt: new Date()
  };

  const resRaw = await Notification.findOneAndUpdate(
    filter,
    { $setOnInsert: toInsert },
    { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
  );

  const note = resRaw.value;
  const wasInserted = resRaw.lastErrorObject && (resRaw.lastErrorObject.upserted || resRaw.lastErrorObject.updatedExisting === false);

  // Mark the dose as notificationSent to avoid double sends (set regardless to keep flags consistent)
  dose.notificationSent = true;
  await dose.save();

  // Respond: if inserted then CREATED else OK with existing
  if (wasInserted) {
    return res.status(201).json(new ApiResponse(201, note, 'Notification created from doseLog'));
  }
  return res.status(200).json(new ApiResponse(200, note, 'Existing notification returned'));
});

export default { getNotificationsForDate };
