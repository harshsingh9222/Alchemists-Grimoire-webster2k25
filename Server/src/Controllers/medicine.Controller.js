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
    console.log("User Medicines->",medicines);
    res.status(200).json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// this is the delete function of the medicine

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // assuming you have auth middleware

    const medicine = await Medicine.findOneAndDelete({ _id: id, userId });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found or not authorized" });
    }

    res.json({ message: "Medicine deleted successfully", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// here is the function for the edit mediciens

export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // assuming auth middleware attaches user

    const updates = req.body;

    const medicine = await Medicine.findOneAndUpdate(
      { _id: id, userId }, 
      updates, 
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found or not authorized" });
    }

    res.json({ message: "Medicine updated successfully", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export {addMedicine,fetchMedicines};