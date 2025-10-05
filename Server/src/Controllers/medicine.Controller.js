import Medicine from "../Models/medicineModel.js";
import User from "../Models/user.models.js"


const addMedicine = async (req, res) => {
  try {
    console.log("in AddMe->",req.body);
    const {medicineName, dosage, frequency, times, startDate, endDate, notes } = req.body;
    const userId = req.user._id;
    console.log("In Addmedincines user->",userId);
    // console.log("User Id by req.user in medicines->",req.user?._id);

    if (!medicineName || !dosage || !frequency || !times?.length) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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

    res.status(201).json({ message: "Medicine saved successfully", medicine: newMedicine });
  } catch (error) {
    console.log("Error in addMedicines->",error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//fetch medicines functionlaty

const fetchMedicines = async (req, res) => {
  try {
     const userId = req.user._id;

    // check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // fetch medicines for this user
    const medicines = await Medicine.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export {addMedicine,fetchMedicines};