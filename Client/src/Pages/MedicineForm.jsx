import React, { useState, useEffect } from "react";
import { addMedicines } from "../api";
import { useSelector, useDispatch } from "react-redux";
import { fetchMedicinesThunk } from "../store/medicineSlice";
import { useNavigate, useLocation } from "react-router-dom";

const MedicineForm = () => {
  const { userData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 read AI suggestion data
  const suggestion = location.state?.suggestion || null;
 
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


  useEffect(() => {
    if (suggestion) {
      setFormData((prev) => ({
        ...prev,
        medicineName: suggestion.medicineName || prev.medicineName,
        dosage: suggestion.dosage || prev.dosage,
        frequency: suggestion.frequency || prev.frequency,
        times: suggestion.defaultTime ? [suggestion.defaultTime] : prev.times,
        notes: suggestion.reason || prev.notes,
      }));
    }
  }, [suggestion]);

  useEffect(() => {
    if (!userData?._id) {
      navigate("/login");
    }
    try {
      if (Intl && typeof Intl.supportedValuesOf === "function") {
        const tzs = Intl.supportedValuesOf("timeZone");
        setTimezones(tzs);
      } else {
        setTimezones([
          "UTC",
          "America/New_York",
          "America/Los_Angeles",
          "Europe/London",
          "Asia/Kolkata",
          "Asia/Tokyo",
        ]);
      }
    } catch (err) {
      setTimezones([
        "UTC",
        "America/New_York",
        "Europe/London",
        "Asia/Kolkata",
      ]);
    }
  }, [userData, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Round entered time to nearest 15 minutes
  const roundToNearest15 = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const rounded = Math.round(totalMinutes / 15) * 15;
    const roundedHours = Math.floor(rounded / 60) % 24;
    const roundedMinutes = rounded % 60;
    return (
      String(roundedHours).padStart(2, "0") +
      ":" +
      String(roundedMinutes).padStart(2, "0")
    );
  };

  const handleTimeChange = (index, value) => {
    const roundedValue = roundToNearest15(value);
    const updatedTimes = [...formData.times];
    updatedTimes[index] = roundedValue;
    setFormData({ ...formData, times: updatedTimes });
  };

  const addTimeField = () => {
    setFormData({ ...formData, times: [...formData.times, ""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = { ...formData, timezone: tz };
      await addMedicines(payload);
      await dispatch(fetchMedicinesThunk());
      navigate("/myMedicines");
    } catch (error) {
      console.error(error);
      alert(error.message || "Error saving medicine");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 bg-gradient-to-br from-[#2d0b5a] via-[#4b0082] to-[#220042] text-white">
      <h1 className="text-4xl font-bold mb-8 text-pink-400 drop-shadow-lg tracking-wide">
        💊 Medicine Tracker
      </h1>

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
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <input
          type="text"
          name="dosage"
          placeholder="Dosage (e.g., 500mg)"
          value={formData.dosage}
          onChange={handleChange}
          required
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <select
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="daily" className="bg-gray-800">
            Daily
          </option>
          <option value="weekly" className="bg-gray-800">
            Weekly
          </option>
          <option value="as-needed" className="bg-gray-800">
            As Needed
          </option>
        </select>

        {formData.times.map((time, i) => (
          <input
            key={i}
            type="time"
            step="900" // 15-minute intervals
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

        <label className="block mb-2 text-gray-300">Timezone (optional):</label>
        <select
          name="timezone"
          value={formData.timezone || ""}
          onChange={(e) => {
            handleChange(e);
            setCustomTz("");
          }}
          className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz} className="bg-gray-800">
              {tz}
            </option>
          ))}
          <option value="">Other...</option>
        </select>

        <p className="text-xs text-gray-400 mb-2">
          By default we detect your timezone. Change only if needed.
        </p>

        {formData.timezone === "" && (
          <input
            type="text"
            placeholder="Enter IANA timezone (e.g., America/New_York)"
            value={customTz}
            onChange={(e) => {
              setCustomTz(e.target.value);
              setFormData({ ...formData, timezone: e.target.value });
            }}
            className="w-full mb-4 p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        )}

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
          Save Medicine
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/myMedicines")}
        className="mt-6 w-full max-w-lg bg-pink-600 hover:bg-pink-500 transition-all p-3 rounded-lg font-bold text-lg shadow-md"
      >
        📋 Go to My Medicines
      </button>
    </div>
  );
};

export default MedicineForm;
