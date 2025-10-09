import PropTypes from "prop-types";
import {
  Clock,
  Pill,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TodayDoses = ({
  todayLoading,
  todayDoses,
  medicines,
  fetchTodayDoses,
  handleDoseAction,
  setShowWellnessModal,
}) => {
  const navigate = useNavigate();

  const handleAddMedicineClick = () => {
    // Use react-router navigation for faster client-side routing
    navigate("/medicine-form");
  };
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-5 h-5 text-purple-300" />
        <div>
          <div className="text-lg font-semibold text-purple-200">
            Today&apos;s Doses
          </div>
          <div className="text-xs text-purple-400">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={fetchTodayDoses}
          className="px-3 py-1 bg-purple-900/50 rounded-lg text-purple-300 hover:scale-105 transition-all"
        >
          Refresh Today
        </button>
        <button
          onClick={() => setShowWellnessModal(true)}
          className="px-3 py-1 bg-pink-900/50 rounded-lg text-pink-200 hover:scale-105 transition-all"
        >
          Update Wellness
        </button>
      </div>

      {todayLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400"></div>
        </div>
      ) : todayDoses.length === 0 ? (
        <div className="text-center py-8">
          <Pill className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-purple-300">No potions scheduled for today</p>
          {medicines.length === 0 && (
            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-all" onClick={()=>{handleAddMedicineClick()}}>
              Add Your First Potion
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayDoses.map((dose) => {
            const isComplete = dose.status === "taken";
            const isMissed = dose.status === "missed";
            const isPending = dose.status === "pending";

            // Determine if the user is allowed to take the dose.
            // Business rule: dose can be taken starting 15 minutes before the scheduled time.
            // If scheduledTime is missing, allow taking (backend will validate if needed).
            const canTake = (() => {
              if (isMissed) return false;
              const scheduled = dose.scheduledTime ? new Date(dose.scheduledTime) : null;
              if (!scheduled || Number.isNaN(scheduled.getTime())) return true; // allow when no scheduled time
              const windowStart = new Date(scheduled.getTime() - 15 * 60 * 1000);
              const now = new Date();
              return now >= windowStart;
            })();

            return (
              <div
                key={dose._id || `${dose.medicineId}-${dose.time}`}
                className={`relative group overflow-hidden bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-indigo-950/90 backdrop-blur-sm rounded-2xl border p-6 transition-all hover:scale-[1.02] ${
                  isComplete
                    ? "ring-2 ring-green-500/50"
                    : isMissed
                    ? "ring-2 ring-red-500/40 bg-red-900/60 border-red-600/30"
                    : "border-purple-500/30"
                }`}
              >
                {isComplete && (
                  <div className="absolute top-2 right-2 animate-pulse">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-purple-200 mb-1">
                      {dose.medicineName || dose.medicine?.medicineName}
                    </h3>
                    <p className="text-purple-400 text-sm">
                      {dose.dosage || dose.medicine?.dosage}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-medium">
                      {dose.time ||
                        new Date(dose.scheduledTime).toLocaleTimeString(
                          "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      isComplete
                        ? "bg-green-500/20 text-green-300"
                        : isMissed
                        ? "bg-red-500/20 text-red-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}
                  >
                    {isComplete && <CheckCircle className="w-3 h-3" />}
                    {isMissed && <XCircle className="w-3 h-3" />}
                    {isPending && <AlertCircle className="w-3 h-3" />}
                    {dose.status || "Pending"}
                  </span>
                </div>

                {!isComplete && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleDoseAction(
                          dose._id,
                          "take",
                          dose.medicineId || dose.medicine?._id,
                          dose.scheduledTime
                        )
                      }
                      disabled={!canTake}
                      title={
                        isMissed
                          ? 'This dose was missed and cannot be taken'
                          : !canTake
                          ? 'You can take this dose starting 15 minutes before its scheduled time'
                          : 'Mark dose as taken'
                      }
                      className={`flex-1 py-2 px-4 text-white rounded-lg transition-all transform ${
                        !canTake
                          ? 'bg-gray-700/40 opacity-60 cursor-not-allowed pointer-events-none'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Take</span>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        handleDoseAction(
                          dose._id,
                          "skip",
                          dose.medicineId || dose.medicine?._id,
                          dose.scheduledTime
                        )
                      }
                      disabled={isMissed}
                      title={isMissed ? 'This dose was missed and cannot be skipped' : 'Skip this dose'}
                      className={`flex-1 py-2 px-4 text-white rounded-lg transition-all transform ${
                        isMissed
                          ? 'bg-gray-700/40 opacity-60 cursor-not-allowed pointer-events-none'
                          : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 hover:scale-105'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Skip</span>
                      </div>
                    </button>
                  </div>
                )}

                {isComplete && (
                  <div className="text-center py-2">
                    <span className="text-green-400 font-medium">
                      ✨ Potion Consumed!
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodayDoses;

TodayDoses.propTypes = {
  todayLoading: PropTypes.bool,
  todayDoses: PropTypes.array,
  medicines: PropTypes.array,
  fetchTodayDoses: PropTypes.func.isRequired,
  handleDoseAction: PropTypes.func.isRequired,
  setShowWellnessModal: PropTypes.func.isRequired,
};
