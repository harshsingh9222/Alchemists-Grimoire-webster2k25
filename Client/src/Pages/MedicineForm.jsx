import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/medicines";

const MedicineForm = () => {
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

  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("authUser"));
    if (savedUser?._id) {
      setUserId(savedUser._id);
      fetchMedicines(savedUser._id);
    }
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API_URL, { ...formData, userId });
      alert(res.data.message || "Medicine saved!");
      fetchMedicines(userId);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error saving medicine");
    }
  };

  const fetchMedicines = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      setMedicines(res.data);
    } catch (error) {
      console.error(error);
      alert("Error fetching medicines");
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
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <input
          type="text"
          name="dosage"
          placeholder="Dosage (e.g., 500mg)"
          value={formData.dosage}
          onChange={handleChange}
          required
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        <select
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        <label className="block mb-2 text-gray-300">End Date (optional):</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-500 p-3 rounded-lg font-bold text-lg shadow-md"
        >
          Save Medicine
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-8 mb-4 text-teal-400">📋 My Medicines</h2>
      <ul className="bg-gray-800 p-4 rounded-xl w-full max-w-lg space-y-2">
        {medicines.map((med) => (
          <li
            key={med._id}
            className="bg-gray-700 p-3 rounded-lg shadow-sm flex justify-between"
          >
            <span>
              <span className="font-semibold text-teal-300">{med.medicineName}</span>{" "}
              - {med.dosage} ({med.frequency})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MedicineForm;
