import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { updateMedicine, fetchMedicines } from "../api";
import { useDispatch } from "react-redux";
import { fetchMedicinesThunk } from "../store/medicineSlice";

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(null);

  // ✅ Load the medicine data for editing
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">✏️ Edit Medicine</h1>

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
          💾 Save Changes
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/myMedicines")}
        className="mt-4 w-full max-w-lg bg-gray-700 hover:bg-gray-600 p-3 rounded-lg font-bold text-lg"
      >
        📋 Back to My Medicines
      </button>
    </div>
  );
};

export default EditMedicine;
