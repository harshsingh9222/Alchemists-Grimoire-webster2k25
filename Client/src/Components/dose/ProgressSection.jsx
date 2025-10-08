import React from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import PropTypes from "prop-types";
import DoseSummaryCard from "./DoseSummaryCard.jsx";

const ProgressSection = ({
  progressDate,
  progressDoses,
  progressLoading,
  summaryData,
  summaryLoading,
  navigateProgressDate,
  handleViewProgress,
  handleDoseAction,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => navigateProgressDate(-1)}
          className="p-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="px-6 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-300" />
            <span className="text-lg font-semibold text-purple-200">
              {progressDate.toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigateProgressDate(1)}
          className="p-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 transition-all"
          disabled={progressDate.toDateString() === new Date().toDateString()}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={handleViewProgress}
          disabled={summaryLoading}
          className="p-3 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/30 hover:scale-105 transition-all disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-300" />
            <span className="text-indigo-200 font-medium">
              {summaryLoading ? "Loading..." : "View Progress Summary"}
            </span>
          </div>
        </button>
      </div>

      {summaryData.length > 0 ? (
        <div className="grid gap-6 w-full max-w-3xl mt-4">
          {summaryData.map((slot, idx) => (
            <DoseSummaryCard
              key={idx}
              time={slot.time}
              medicines={slot.medicines}
            />
          ))}
        </div>
      ) : (
        !summaryLoading && (
          <p className="text-indigo-300 text-sm opacity-80 text-center">
            Click “View Progress Summary" to see the summary for the selected
            date.
          </p>
        )
      )}

      <div className="mt-6">
        <h3 className="text-lg text-purple-200 font-semibold mb-3">
          Dose Log ({progressDoses.length})
        </h3>
        {progressLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
          </div>
        ) : progressDoses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-300">No doses recorded for this date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressDoses.map((dose) => {
              const isComplete = dose.status === "taken";
              const isMissed = dose.status === "missed";
              const isPending = dose.status === "pending";
              return (
                <div
                  key={dose._id || `${dose.medicineId}-${dose.time}`}
                  className={`relative group overflow-hidden bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-indigo-950/90 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 transition-all hover:scale-[1.02] ${
                    isComplete ? "ring-2 ring-green-500/50" : ""
                  }`}
                >
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
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105"
                      >
                        Take
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
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all transform hover:scale-105"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressSection;

ProgressSection.propTypes = {
  progressDate: PropTypes.instanceOf(Date).isRequired,
  progressDoses: PropTypes.array.isRequired,
  progressLoading: PropTypes.bool,
  summaryData: PropTypes.array,
  summaryLoading: PropTypes.bool,
  navigateProgressDate: PropTypes.func.isRequired,
  handleViewProgress: PropTypes.func.isRequired,
  handleDoseAction: PropTypes.func.isRequired,
};
