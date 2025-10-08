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
      const eventPayload = {
        summary: `Medicine: ${medicineName}`,
        description: notes || `Dosage: ${dosage} | Frequency: ${frequency}`,
        start: {
          // Use startDate as the base; Google requires dateTime or date depending on all-day events
          dateTime: new Date(startDate).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(startDate).toISOString(),
          timeZone: 'UTC'
        },
        // Optionally create reminders
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 }
          ]
        }
      }

      const calendarResult = await createCalendarEventForUser(userId, eventPayload)
      if (calendarResult?.success && calendarResult?.eventId) {
        newMedicine.googleEventId = calendarResult.eventId
        newMedicine.googleCalendarCreatedAt = new Date()
        await newMedicine.save()
        console.log('Google Calendar event created with id:', calendarResult.eventId)
      } else {
        console.log('Google Calendar event not created:', calendarResult?.error)
      }
    } catch (err) {
      console.error('Error while creating Google Calendar event for medicine:', err)
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