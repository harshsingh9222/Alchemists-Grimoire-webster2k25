import React, { useEffect, useState } from "react";
import BackButton from "../Components/BackButton";
import { useParams, useNavigate } from "react-router-dom";
import { updateMedicine, fetchMedicines } from "../api";
import { useDispatch } from "react-redux";
import { fetchMedicinesThunk } from "../store/medicineSlice";

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(null);

  // Load the medicine data
  useEffect(() => {
    const load = async () => {
      const all = await fetchMedicines();
      const med = all.find((m) => m._id === id);
      if (med) {
        setFormData({
          medicineName: med.medicineName || "",
          dosage: med.dosage || "",
          frequency: med.frequency || "daily",
          times: med.times?.length ? med.times : [""],
          startDate: med.startDate ? med.startDate.slice(0, 10) : "",
          endDate: med.endDate ? med.endDate.slice(0, 10) : "",
          notes: med.notes || "",
        });
      }
    };
    load();
  }, [id]);

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
      await updateMedicine(id, formData);
      await dispatch(fetchMedicinesThunk());
      navigate("/myMedicines");
    } catch (err) {
      console.error(err);
      alert("Failed to update medicine");
    }
  };

  if (!formData)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gradient-to-br from-[#2d0b5a] via-[#4b0082] to-[#220042] text-white">
      <h1 className="text-4xl font-bold mb-8 text-pink-400 drop-shadow-lg tracking-wide">
        ✏️ Edit Medicine
      </h1>

      <div className="w-full max-w-lg -mt-4 mb-6">
        <BackButton className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-lg" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="backdrop-blur-lg bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <input
          type="text"
          name="medicineName"
          placeholder="Medicine Name"
          value={formData.medicineName}
          onChange={handleChange}
          required
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <input
          type="text"
          name="dosage"
          placeholder="Dosage (e.g., 500mg)"
          value={formData.dosage}
          onChange={handleChange}
          required
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <select
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
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
            className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        ))}

        <button
          type="button"
          onClick={addTimeField}
          className="mb-4 w-full bg-pink-600 hover:bg-pink-500 transition-all p-2 rounded-lg font-semibold shadow-md"
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
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <label className="block mb-2 text-gray-300">End Date (optional):</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <button
          type="submit"
          className="w-full bg-pink-600 hover:bg-pink-500 transition-all p-3 rounded-lg font-bold text-lg shadow-md"
        >
          💾 Save Changes
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/myMedicines")}
        className="mt-6 w-full max-w-lg bg-pink-600 hover:bg-pink-500 transition-all p-3 rounded-lg font-bold text-lg shadow-md"
      >
        📋 Back to My Medicines
      </button>
    </div>
  );
};

export default EditMedicine;
