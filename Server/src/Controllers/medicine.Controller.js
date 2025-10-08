import Medicine from "../Models/medicineModel.js";
import User from "../Models/user.models.js";
import DoseLog from "../Models/doseLogModel.js";
import { createDoseLogsForMedicine } from "../Utils/doseLogCreater.js";import { createCalendarEventForUser } from "../Utils/googleCalendar.js"


const addMedicine = async (req, res) => {
  try {
    console.log("in AddMe->", req.body);
    const { medicineName, dosage, frequency, times, startDate, endDate, notes } = req.body;
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
          start: { dateTime: startDt.toISOString(), timeZone: 'UTC' },
          end: { dateTime: endDt.toISOString(), timeZone: 'UTC' },
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
        }

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
    const userId = req.user._id;

    const medicine = await Medicine.findOneAndDelete({ _id: id, userId });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found or not authorized" });
    }

    // 🎯 IMPORTANT: Delete all future dose logs for this medicine
    await DoseLog.deleteMany({
      medicineId: id,
      status: 'pending', 
      scheduledTime: { $gte: new Date() }
    });

    res.json({ message: "Medicine and future doses deleted successfully", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const medicine = await Medicine.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found or not authorized" });
    }

    // 🎯 If times or frequency changed, update future dose logs
    if (updates.times || updates.frequency) {
      // Delete future pending doses
      await DoseLog.deleteMany({
        medicineId: id,
        status: 'pending',
        scheduledTime: { $gte: new Date() }
      });
      
      // Recreate dose logs with new schedule
      await createDoseLogsForMedicine(medicine, userId);
    }

    res.json({ message: "Medicine updated successfully", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export { addMedicine, fetchMedicines };