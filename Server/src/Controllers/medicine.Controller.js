import Medicine from "../Models/medicineModel.js";
import User from "../Models/user.models.js";
import DoseLog from "../Models/doseLogModel.js";
import { createDoseLogsForMedicine } from "../Utils/doseLogCreater.js";

const addMedicine = async (req, res) => {
  try {
    console.log("in AddMe->", req.body);
    const { medicineName, dosage, frequency, times, startDate, endDate, notes } = req.body;
    const userId = req.user._id;
    console.log("In Addmedincines user->", userId);

    if (!medicineName || !dosage || !frequency || !times?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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