import Medicine from "../Models/medicineModel.js";
import User from "../Models/user.models.js";
import DoseLog from "../Models/doseLogModel.js";
import { createDoseLogsForMedicine } from "../Utils/doseLogCreater.js";
import { createCalendarEventForUser, deleteCalendarEventForUser, getCalendarEventDetailsForUser } from "../Utils/googleCalendar.js"


const addMedicine = async (req, res) => {
  try {
    console.log("in AddMe->", req.body);
  const { medicineName, dosage, frequency, times, startDate, endDate, notes, timezone } = req.body;
    // Ensure auth middleware attached user
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - user missing from request' })
    }
    const userId = req.userId || req.user._id;
    console.log("In Addmedincines user->", userId);

    if (!medicineName || !dosage || !frequency || !times?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("user not found in add medicines");
      return res.status(404).json({ message: "User not found" });
    }
    else console.log("user found in add medicines:", user._id);
    

    // Create the medicine
    const newMedicine = new Medicine({
      userId,
      medicineName,
      dosage,
      frequency,
      times,
      startDate,
      endDate,
      notes,
      timezone,
    });

    await newMedicine.save();

    // Try to create a Google Calendar event for this medicine if the user has connected Google
    try {
      // Helper to format a date into RRULE UNTIL format: YYYYMMDDTHHMMSSZ
      const formatDateToRRuleUntil = (d) => {
        const dt = new Date(d);
        const Y = dt.getUTCFullYear();
        const M = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const D = String(dt.getUTCDate()).padStart(2, '0');
        const h = String(dt.getUTCHours()).padStart(2, '0');
        const m = String(dt.getUTCMinutes()).padStart(2, '0');
        const s = String(dt.getUTCSeconds()).padStart(2, '0');
        return `${Y}${M}${D}T${h}${m}${s}Z`;
      };

      const createdEventIds = [];

      // Create one recurring event per time in the medicine.times array
      for (const timeStr of times) {
        const [hours, minutes] = timeStr.split(':').map(Number);

        // Build a start DateTime using startDate's date and the medicine time
        const startDt = new Date(startDate);
        startDt.setHours(hours, minutes, 0, 0);

        // Use a short default duration for the event (15 minutes)
        const endDt = new Date(startDt.getTime() + 15 * 60 * 1000);

        const eventPayload = {
          summary: `Medicine: ${medicineName}`,
          description: notes || `Dosage: ${dosage} | Frequency: ${frequency}`,
          start: { dateTime: startDt.toISOString(), timeZone: newMedicine.timezone || 'UTC' },
          end: { dateTime: endDt.toISOString(), timeZone: newMedicine.timezone || 'UTC' },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] }
        };

        // Add recurrence based on frequency
        if (frequency === 'daily') {
          if (endDate) {
            eventPayload.recurrence = [`RRULE:FREQ=DAILY;UNTIL=${formatDateToRRuleUntil(endDate)}`];
          } else {
            eventPayload.recurrence = ['RRULE:FREQ=DAILY'];
          }
        } else if (frequency === 'weekly') {
          // Use the weekday of startDate for BYDAY
          const weekdayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const byday = weekdayMap[new Date(startDate).getDay()];
          if (endDate) {
            eventPayload.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${formatDateToRRuleUntil(endDate)}`];
          } else {
            eventPayload.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byday}`];
          }
        } else {
          // as-needed -> no recurrence (single event at startDate/time)
          // no recurrence field needed
        }

        // Attempt to create calendar event for this time
        const calendarResult = await createCalendarEventForUser(userId, eventPayload);
        if (calendarResult?.success && calendarResult?.eventId) {
          createdEventIds.push(calendarResult.eventId);
          console.log('Google Calendar event created with id:', calendarResult.eventId);
        } else {
          console.log('Google Calendar event not created for time', timeStr, ':', calendarResult?.error);
        }

      }

      if (createdEventIds.length > 0) {
        // Store created event IDs as JSON string (model currently holds a string)
        newMedicine.googleEventId = JSON.stringify(createdEventIds);
        newMedicine.googleCalendarCreatedAt = new Date();
        await newMedicine.save();
      }
    } catch (err) {
      console.error('Error while creating Google Calendar event(s) for medicine:', err);
    }

    // 🎯 IMPORTANT: Create dose logs for the next 30 days
    await createDoseLogsForMedicine(newMedicine, userId);

    res.status(201).json({ 
      message: "Medicine saved and dose schedule created successfully", 
      medicine: newMedicine 
    });
  } catch (error) {
    console.log("Error in addMedicines->", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch medicines functionality
const fetchMedicines = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const medicines = await Medicine.find({ userId }).sort({ createdAt: -1 });
    console.log("User Medicines->", medicines);
    res.status(200).json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete medicine and its dose logs
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?._id;

    // 🔍 Step 1: Find medicine first
    const medicine = await Medicine.findOne({ _id: id, userId });
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found or not authorized" });
    }

    // 🗑️ Step 2: Delete only *future pending* dose logs
    // Use the medicine._id (ObjectId) to avoid string/object mismatches
    await DoseLog.deleteMany({
      medicineId: medicine._id,
      status: "pending",
      scheduledTime: { $gte: new Date() },
    });

    // 📅 Step 3: Delete only *future* Google Calendar events (not past ones)
    if (medicine.googleEventId) {
      let eventIds = [];
      try {
        eventIds = JSON.parse(medicine.googleEventId);
      } catch (err) {
        console.warn("Failed to parse Google Event IDs:", err);
      }

      for (const eventId of eventIds) {
        try {
          const eventDetails = await getCalendarEventDetailsForUser(userId, eventId);

          if (
            eventDetails.success &&
            eventDetails.data?.start &&
            new Date(eventDetails.data.start.dateTime || eventDetails.data.start.date) >= new Date()
          ) {
            await deleteCalendarEventForUser(userId, eventId);
            console.log(`🗑️ Deleted future Google Calendar event: ${eventId}`);
          } else {
            console.log(`⏳ Skipped past event: ${eventId}`);
          }
        } catch (err) {
          console.error(`⚠️ Failed to delete event ${eventId}:`, err.message);
        }
      }
    }

    // 💊 Step 4: Delete the medicine record
    await Medicine.deleteOne({ _id: id, userId });

    res.json({
      message: "Medicine, future doses, and future calendar events deleted successfully",
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};




// Update medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?._id;
    const updates = req.body;

    // 🔹 Find medicine
    const medicine = await Medicine.findOne({ _id: id, userId });
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found or not authorized" });
    }

    // 🔹 Update fields
    Object.keys(updates).forEach((key) => {
      medicine[key] = updates[key];
    });

    // Persist the updates first so helper functions that read from DB see the latest values
    await medicine.save();

    // 🔹 Check if schedule-related fields changed
    const scheduleFields = ["timezone", "times", "frequency", "startDate", "endDate"];
    const scheduleChanged = scheduleFields.some((field) => updates[field] !== undefined);

    // 🔹 Delete future pending doses if schedule changed
    if (scheduleChanged) {
      // Use the medicine._id (ObjectId) to avoid string/object mismatches
      await DoseLog.deleteMany({
        medicineId: medicine._id,
        status: "pending",
        scheduledTime: { $gte: new Date() },
      });

      // Recreate dose logs using the saved medicine document
      await createDoseLogsForMedicine(medicine, userId);
    }

    // 🔹 Handle Google Calendar events if schedule changed
    if (scheduleChanged && medicine.googleEventId) {
      let eventIds = [];
      try {
        eventIds = JSON.parse(medicine.googleEventId);
      } catch (err) {
        console.warn("Failed to parse Google Event IDs:", err);
      }

      for (const eventId of eventIds) {
        try {
          const eventDetails = await getCalendarEventDetailsForUser(userId, eventId);

          if (
            eventDetails.success &&
            eventDetails.data?.start &&
            new Date(eventDetails.data.start.dateTime || eventDetails.data.start.date) >= new Date()
          ) {
            await deleteCalendarEventForUser(userId, eventId);
            console.log(`🗑️ Deleted future Google Calendar event: ${eventId}`);
          } else {
            console.log(`⏳ Skipped past event: ${eventId}`);
          }
        } catch (err) {
          console.error(`⚠️ Failed to delete event ${eventId}:`, err.message);
        }
      }
    }

    // 🔹 Recreate new Google Calendar events
    const createdEventIds = [];
    const { times, startDate, endDate, medicineName, dosage, frequency, notes, timezone } = medicine;

    const formatDateToRRuleUntil = (d) => {
      const dt = new Date(d);
      const Y = dt.getUTCFullYear();
      const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const D = String(dt.getUTCDate()).padStart(2, "0");
      const h = String(dt.getUTCHours()).padStart(2, "0");
      const m = String(dt.getUTCMinutes()).padStart(2, "0");
      const s = String(dt.getUTCSeconds()).padStart(2, "0");
      return `${Y}${M}${D}T${h}${m}${s}Z`;
    };

    for (const timeStr of times) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const startDt = new Date(startDate);
      startDt.setHours(hours, minutes, 0, 0);
      const endDt = new Date(startDt.getTime() + 15 * 60 * 1000);

      const eventPayload = {
        summary: `Medicine: ${medicineName}`,
        description: notes || `Dosage: ${dosage} | Frequency: ${frequency}`,
        start: { dateTime: startDt.toISOString(), timeZone: timezone || "UTC" },
        end: { dateTime: endDt.toISOString(), timeZone: timezone || "UTC" },
        reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 10 }] },
      };

      if (frequency === "daily") {
        eventPayload.recurrence = endDate
          ? [`RRULE:FREQ=DAILY;UNTIL=${formatDateToRRuleUntil(endDate)}`]
          : ["RRULE:FREQ=DAILY"];
      } else if (frequency === "weekly") {
        const weekdayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const byday = weekdayMap[new Date(startDate).getDay()];
        eventPayload.recurrence = endDate
          ? [`RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${formatDateToRRuleUntil(endDate)}`]
          : [`RRULE:FREQ=WEEKLY;BYDAY=${byday}`];
      }

      try {
        const result = await createCalendarEventForUser(userId, eventPayload);
        if (result.success && result.eventId) createdEventIds.push(result.eventId);
      } catch (err) {
        console.error("❌ Failed to create calendar event:", err);
      }
    }

    // 🔹 Save new event IDs as JSON string
    medicine.googleEventId = JSON.stringify(createdEventIds);
    await medicine.save();

    res.json({
      message: "✅ Medicine updated and calendar synced successfully",
      medicine,
    });
  } catch (error) {
    console.error("❌ updateMedicine error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export { addMedicine, fetchMedicines };