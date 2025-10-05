import React, { useState, useEffect } from "react";
import { addMedicines, fetchMedicines } from "../api";
import { useSelector, useDispatch } from "react-redux";
import { addMedicine , setMedicines } from "../store/medicineSlice";
import { useNavigate } from "react-router-dom";

const MedicineForm = () => {
  const { userData } = useSelector((state) => state.auth);
  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    frequency: "daily",
    times: [""],
    startDate: "",
    endDate: "",
    notes: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData?._id) {
      setUserId(userData._id);
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTimeChange = (index, value) => {
    const updatedTimes = [...formData.times];
    updatedTimes[index] = value;
    setFormData({ ...formData, times: updatedTimes });
  };

  const addTimeField = () => {
    setFormData({ ...formData, times: [...formData.times, ""] });
  };


  // here is the function for adding the medicne
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };

      // Save to backend
      const res = await addMedicines(payload);
      alert(res.message || "Medicine saved!");

      // Fetch updated medicines for user
      const fetched = await fetchMedicines();

      // Save in Redux
      dispatch(setMedicines(fetched));

      // Redirect to MyMedicines page
      navigate("/myMedicines");
    } catch (error) {
      console.error(error);
      alert(error.message || "Error saving medicine");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">💊 Medicine Tracker</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-lg"
      >
        <input
          type="text"
          name="medicineName"
          placeholder="Medicine Name"
          value={formData.medicineName}
          onChange={handleChange}
          required
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

        <input
          type="text"
          name="dosage"
          placeholder="Dosage (e.g., 500mg)"
          value={formData.dosage}
          onChange={handleChange}
          required
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

        <select
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="as-needed">As Needed</option>
        </select>

        {formData.times.map((time, i) => (
          <input
            key={i}
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(i, e.target.value)}
            required
            className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
          />
        ))}

        <button
          type="button"
          onClick={addTimeField}
          className="mb-4 w-full bg-teal-600 hover:bg-teal-500 p-2 rounded-lg font-semibold"
        >
          + Add Time
        </button>

        <label className="block mb-2 text-gray-300">Start Date:</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          required
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

        <label className="block mb-2 text-gray-300">End Date (optional):</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-500 p-3 rounded-lg font-bold text-lg"
        >
          Save Medicine
        </button>
      </form>
    </div>
  );
};

export default MedicineForm;
