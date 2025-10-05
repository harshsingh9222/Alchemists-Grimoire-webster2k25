import React, { useEffect } from "react";
import { useSelector,useDispatch } from "react-redux";
import { setMedicines } from "../store/medicineSlice";
import { fetchMedicines } from "../api";


const MyMedicines = () => {
  const { userMedicines } = useSelector((state) => state.medicine);
   const { userData } = useSelector((state) => state.auth);
    const { dispatch } = useDispatch();
   useEffect(() => {
    const loadMedicines = async () => {
      if (userData?._id) {
        const fetched = await fetchMedicines(); 
        dispatch(setMedicines(fetched));
      }
    };

    loadMedicines();
  }, [dispatch, userData]);
    console.log("UserMedicines->",userMedicines);
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h2 className="text-3xl font-bold text-teal-400 mb-6">📋 My Medicines</h2>

      {userMedicines && userMedicines.length > 0 ? (
        <ul className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-lg space-y-3">
          {userMedicines.map((med) => (
            <li
              key={med._id}
              className="bg-gray-700 p-4 rounded-lg shadow-md hover:bg-gray-600 transition"
            >
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
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No medicines added yet.</p>
      )}
    </div>
  );
};

export default MyMedicines;
