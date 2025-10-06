import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMedicinesThunk } from "../store/medicineSlice";
import { deleteMedicine } from "../api";
import { useNavigate } from "react-router-dom";

const MyMedicines = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userMedicines, loading, error } = useSelector((state) => state.medicine);
  const { userData } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userData?._id) {
      dispatch(fetchMedicinesThunk());
    }
  }, [dispatch, userData]);

  // ✅ Delete handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteMedicine(id);
        dispatch(fetchMedicinesThunk()); // refresh list
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h2 className="text-3xl font-bold text-teal-400 mb-6">📋 My Medicines</h2>

      {loading && <p className="text-gray-400">Loading medicines...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {userMedicines && userMedicines.length > 0 ? (
        <ul className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-lg space-y-3">
          {userMedicines.map((med) => (
            <li
              key={med._id}
              className="bg-gray-700 p-4 rounded-lg shadow-md hover:bg-gray-600 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-teal-300 text-lg">{med.medicineName}</div>
                  <div className="text-gray-300">
                    {med.dosage} • {med.frequency}
                  </div>
                  <div className="text-sm text-gray-400">
                    {med.startDate} → {med.endDate || "Ongoing"}
                  </div>
                  {med.notes && (
                    <p className="text-gray-400 mt-2 italic">💬 {med.notes}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(med._id)}
                    className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-lg text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(med._id)}
                    className="bg-red-500 hover:bg-red-400 px-3 py-1 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p className="text-gray-400">No medicines added yet.</p>
      )}
    </div>
  );
};

export default MyMedicines;
