import React, { useState, useEffect } from "react";
import { addMedicines } from "../api";
import { useSelector, useDispatch } from "react-redux";
import { fetchMedicinesThunk } from "../store/medicineSlice"; 
import { useNavigate } from "react-router-dom";

const MedicineForm = () => {
  const { userData } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    frequency: "daily",
    times: [""],
    startDate: "",
    endDate: "",
    notes: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });

  const [timezones, setTimezones] = useState([]);
  const [customTz, setCustomTz] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData?._id) {
      navigate("/login"); // redirect if not logged in
    }
    // Populate timezone options where supported
    try {
      if (Intl && typeof Intl.supportedValuesOf === 'function') {
        const tzs = Intl.supportedValuesOf('timeZone');
        setTimezones(tzs);
      } else {
        // fallback curated list
        setTimezones(["UTC","America/New_York","America/Los_Angeles","Europe/London","Asia/Kolkata","Asia/Tokyo"]);
      }
    } catch (err) {
      setTimezones(["UTC","America/New_York","Europe/London","Asia/Kolkata"]);
    }
  }, [userData, navigate]);

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

  // ✅ Add medicine then refresh store
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Attach user's timezone so server can compute scheduled instants correctly
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = { ...formData, timezone: tz };
      await addMedicines(payload); // save to backend
      await dispatch(fetchMedicinesThunk()); // refresh Redux store
      navigate("/myMedicines"); // redirect
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

        <label className="block mb-2 text-gray-300">Timezone (optional):</label>
        <select
          name="timezone"
          value={formData.timezone || ''}
          onChange={(e) => {
            handleChange(e);
            setCustomTz('');
          }}
          className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
          <option value="">Other...</option>
        </select>

  <p className="text-xs text-gray-400 mb-2">By default we detect your timezone. Change only if you want this schedule to follow a different timezone.</p>

  {formData.timezone === '' && (
          <input
            type="text"
            placeholder="Enter IANA timezone (e.g., America/New_York)"
            value={customTz}
            onChange={(e) => { setCustomTz(e.target.value); setFormData({ ...formData, timezone: e.target.value }); }}
            className="w-full mb-3 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
          />
        )}

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
      <button
          type="button"
          onClick={() => navigate("/myMedicines")}
          className="w-full bg-teal-600 hover:bg-teal-500 p-3 rounded-lg font-bold text-lg"
        >
          📋 Go to My Medicines
        </button>
    </div>
  );
};

export default MedicineForm;
