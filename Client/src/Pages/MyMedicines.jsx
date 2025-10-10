import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMedicinesThunk } from "../store/medicineSlice";
import { deleteMedicine } from "../api";
import { useNavigate } from "react-router-dom";

const MyMedicines = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userMedicines, loading, error } = useSelector(
    (state) => state.medicine
  );
  const { userData } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userData?._id) {
      dispatch(fetchMedicinesThunk());
    }
  }, [dispatch, userData]);

  const today = new Date().setHours(0, 0, 0, 0); // start of today

  // ✅ Delete handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteMedicine(id);
        dispatch(fetchMedicinesThunk());
      } catch (err) {
        console.error(err);
        alert("Failed to delete medicine");
      }
    }
  };

  // ✅ Edit handler
  const handleEdit = (id) => {
    navigate(`/edit-medicine/${id}`);
  };

  // ✅ Separate active and completed medicines
  const activeMeds = userMedicines?.filter(
    (med) => !med.endDate || new Date(med.endDate).setHours(0, 0, 0, 0) >= today
  );
  const completedMeds = userMedicines?.filter(
    (med) => med.endDate && new Date(med.endDate).setHours(0, 0, 0, 0) < today
  );

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gradient-to-br from-[#2d0b5a] via-[#4b0082] to-[#220042] text-white">
      <h2 className="text-4xl font-bold mb-8 text-pink-400 drop-shadow-lg tracking-wide">
        📋 Medicines Schedule
      </h2>

      {loading && <p className="text-gray-300">Loading medicines...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {/* Active Medicines */}
      {activeMeds && activeMeds.length > 0 && (
        <>
          <h3 className="text-2xl font-bold text-pink-300 mb-4">🟢 Active</h3>
          <ul className="backdrop-blur-lg bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl w-full max-w-lg space-y-4 mb-8">
            {activeMeds.map((med) => (
              <li
                key={med._id}
                className="bg-white/10 border border-white/20 p-4 rounded-xl shadow-md hover:bg-white/20 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-pink-400 text-xl mb-1">
                      {med.medicineName}
                    </div>
                    <div className="text-gray-200 text-sm mb-1">
                      {med.dosage} • {med.frequency}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {med.startDate
                        ? new Date(med.startDate).toLocaleDateString()
                        : ""}{" "}
                      →{" "}
                      {med.endDate
                        ? new Date(med.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </div>

                    {med.timezone && (
                      <div className="mt-1 inline-block rounded-full bg-pink-700/60 px-3 py-1 text-xs text-pink-100 mb-2">
                        🕒 {med.timezone}
                      </div>
                    )}

                    {med.times && med.times.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {med.times.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-pink-500/30 border border-pink-400/50 rounded-full px-3 py-1 text-xs text-white"
                          >
                            ⏰ {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {med.notes && (
                      <p className="text-gray-300 mt-3 italic text-sm">
                        💬 {med.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-3">
                    <button
                      onClick={() => handleEdit(med._id)}
                      className="bg-pink-600 hover:bg-pink-500 px-3 py-1 rounded-lg text-sm font-semibold shadow-md transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(med._id)}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg text-sm font-semibold shadow-md transition"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Completed Medicines */}
      {completedMeds && completedMeds.length > 0 && (
        <>
          <h3 className="text-2xl font-bold text-pink-300 mb-4">
            ✅ Completed
          </h3>
          <ul className="backdrop-blur-lg bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl w-full max-w-lg space-y-4 mb-8">
            {completedMeds.map((med) => (
              <li
                key={med._id}
                className="bg-white/10 border border-white/20 p-4 rounded-xl shadow-md hover:bg-white/20 transition opacity-70"
              >
                <div>
                  <div className="font-bold text-gray-300 text-xl mb-1">
                    {med.medicineName}
                  </div>
                  <div className="text-gray-400 text-sm mb-1">
                    {med.dosage} • {med.frequency}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {med.startDate
                      ? new Date(med.startDate).toLocaleDateString()
                      : ""}{" "}
                    →{" "}
                    {med.endDate
                      ? new Date(med.endDate).toLocaleDateString()
                      : "Ongoing"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {(!userMedicines || userMedicines.length === 0) && !loading && (
        <p className="text-gray-300 text-lg mt-4">No medicines added yet. 💊</p>
      )}

      <button
        type="button"
        onClick={() => navigate("/medicine-form")}
        className="mt-6 w-full max-w-lg bg-pink-600 hover:bg-pink-500 transition-all p-3 rounded-lg font-bold text-lg shadow-md"
      >
        ➕ Add New Medicine
      </button>
    </div>
  );
};

export default MyMedicines;
