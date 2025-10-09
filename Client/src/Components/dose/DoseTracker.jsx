import React, { useState, useEffect, useCallback } from "react";
import { Clock, Pill, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doseService } from "../../Services/doseServices";
import { fetchDoseSummary } from "../../api";
import { useToast } from "../../Components/Toast/ToastProvider.jsx";
import TodayDoses from "./TodayDoses";
import ProgressSection from "./ProgressSection";
import UpdateWellness from "./UpdateWellness";

const DoseTracker = () => {
  const { showToast } = useToast();
  const [todayDoses, setTodayDoses] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [view, setView] = useState("today"); // "today" | "progress" | "wellness"
  const [progressDate, setProgressDate] = useState(new Date());
  const [progressDoses, setProgressDoses] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const getDosesForDate = useCallback(async (date) => {
    try {
      const resdata = await doseService.getDosesByDate(date);
      const fetched = Array.isArray(resdata)
        ? resdata
        : Array.isArray(resdata?.doses)
        ? resdata.doses
        : Array.isArray(resdata?.data)
        ? resdata.data
        : [];

      if (!Array.isArray(fetched)) {
        console.debug("getDosesForDate: normalized fetched is not array", resdata);
        return [];
      }

      return fetched;
    } catch (error) {
      console.error("Error fetching doses for date:", error);
      return [];
    }
  }, []);

  // Fetches progress doses for the selected progressDate
  const fetchProgressDoses = useCallback(
    async (date) => {
      setProgressLoading(true);
      try {
        const fetched = await getDosesForDate(date);
        setProgressDoses(fetched);
        return fetched; // <-- return the array so callers can use fresh data
      } finally {
        setProgressLoading(false);
      }
    },
    [getDosesForDate]
  );

  const fetchMedicinesInDose = useCallback(async () => {
    try {
      const resdata = await doseService.getMedicines();
      const meds = Array.isArray(resdata)
        ? resdata
        : Array.isArray(resdata?.medicines)
        ? resdata.medicines
        : Array.isArray(resdata?.data)
        ? resdata.data
        : [];
      if (
        !Array.isArray(resdata) &&
        !Array.isArray(resdata?.medicines) &&
        !Array.isArray(resdata?.data)
      ) {
        console.debug("fetchMedicinesInDose: unexpected response shape", resdata);
      }
      setMedicines(meds);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  }, []);

  const handleViewProgress = async () => {
    try {
      setSummaryLoading(true);
      const data = await fetchDoseSummary(progressDate);
      setSummaryData(data?.summary || []);
      console.log("Fetched dose summary for", progressDate, data);
    } catch (error) {
      console.error("Error fetching dose summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  // shared action (take/skip). After update, refresh both today's doses AND progress doses
  const handleDoseAction = async (doseId, action, medicineId, scheduledTime) => {
    try {
      // Normalize scheduledTime to ISO string when sending from client
      let scheduledIso = null;
      if (scheduledTime) {
        if (scheduledTime instanceof Date) scheduledIso = scheduledTime.toISOString();
        else if (typeof scheduledTime === 'number') scheduledIso = new Date(scheduledTime).toISOString();
        else if (typeof scheduledTime === 'string') {
          // crude ISO check (has T and Z or timezone offset)
          if (scheduledTime.includes('T') && (scheduledTime.endsWith('Z') || scheduledTime.includes('+') || scheduledTime.includes('-'))) {
            scheduledIso = scheduledTime;
          } else {
            // attempt to parse and re-serialize
            const d = new Date(scheduledTime);
            scheduledIso = Number.isFinite(d.getTime()) ? d.toISOString() : scheduledTime;
          }
        }
      }

      const payload = doseId
        ? { doseId, status: action === "take" ? "taken" : "skipped" }
        : {
            medicineId,
            scheduledTime: scheduledIso,
            status: action === "take" ? "taken" : "skipped",
          };

      await doseService.updateDoseStatus(payload);

      // get fresh lists (use returned arrays to avoid stale React state)
      const [freshToday] = await Promise.all([
        fetchTodayDoses(), // now returns array
        fetchProgressDoses(progressDate),
      ]);

      showSuccessAnimation(action);

      // compute allTaken from the freshly returned array (not React state)
      const allTaken =
        Array.isArray(freshToday) && freshToday.length > 0
          ? freshToday.every((d) => d.status === "taken")
          : false;
      if (allTaken) setShowWellnessModal(true);
    } catch (error) {
      console.error("Error recording dose:", error);
      // If server rejected due to early 'taken', show friendly toast
      if (error?.response?.status === 403 || (error?.message && error.message.includes('Too early to mark'))) {
        showToast('Too early to mark this dose as taken. You can take it starting 15 minutes before scheduled time.', 'error');
      } else {
        showToast('Failed to record dose. Please try again.', 'error');
      }
    }
  };

  const showSuccessAnimation = (action) => {
    const sparkle = document.createElement("div");
    sparkle.className =
      "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-6xl animate-ping";
    sparkle.innerHTML = action === "take" ? "✨" : "⏭️";
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1000);
  };

  const navigateProgressDate = (direction) => {
    const newDate = new Date(progressDate);
    newDate.setDate(progressDate.getDate() + direction);
    setProgressDate(newDate);
  };

  // fetchTodayDoses now returns the fetched array as well as updating state
  const fetchTodayDoses = useCallback(async () => {
    setTodayLoading(true);
    try {
      const datee = new Date();
      datee.setHours(0, 0, 0, 0);
      const res = await doseService.getDosesByDate(datee);
      const fetched =
        Array.isArray(res) || Array.isArray(res?.doses) || Array.isArray(res?.data)
          ? res.doses || res.data || res
          : [];
      setTodayDoses(fetched);
      return fetched; // <-- return array for callers
    } catch (err) {
      console.error("Error fetching today's doses:", err);
      return [];
    } finally {
      setTodayLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayDoses();
  }, [fetchTodayDoses]);

  useEffect(() => {
    fetchMedicinesInDose();
  }, [fetchMedicinesInDose]);

  useEffect(() => {
    if (view === "progress") {
      fetchProgressDoses(progressDate);
    }
  }, [view, progressDate, fetchProgressDoses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-purple-300/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 10 + i * 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            🧪 Potion Tracker
          </h1>
          <p className="text-purple-300/70">Track your magical elixirs and wellness</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setView("today")}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
              view === "today" ? "bg-purple-600 scale-105" : "bg-purple-900/50 hover:bg-purple-800/70"
            }`}
          >
            Today’s Doses
          </button>
          <button
            onClick={() => setView("progress")}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
              view === "progress" ? "bg-indigo-600 scale-105" : "bg-indigo-900/50 hover:bg-indigo-800/70"
            }`}
          >
            View Progress
          </button>
          <button
            onClick={() => setView("wellness")}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
              view === "wellness" ? "bg-pink-600 scale-105" : "bg-pink-900/50 hover:bg-pink-800/70"
            }`}
          >
            Update Wellness
          </button>
        </div>

        <AnimatePresence mode="wait">
          {view === "today" && (
            <motion.div key="today" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }}>
              <TodayDoses
                todayLoading={todayLoading}
                todayDoses={todayDoses}
                medicines={medicines}
                fetchTodayDoses={fetchTodayDoses}
                handleDoseAction={handleDoseAction}
                setShowWellnessModal={setShowWellnessModal}
              />
            </motion.div>
          )}

          {view === "progress" && (
            <motion.div key="progress" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }}>
              <ProgressSection
                progressDate={progressDate}
                progressDoses={progressDoses}
                progressLoading={progressLoading}
                summaryData={summaryData}
                summaryLoading={summaryLoading}
                navigateProgressDate={navigateProgressDate}
                handleViewProgress={handleViewProgress}
                handleDoseAction={handleDoseAction}
              />
            </motion.div>
          )}

          {view === "wellness" && (
            <motion.div key="wellness" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }}>
              <UpdateWellness onClose={async () => { await fetchTodayDoses(); setView("today"); }} />
            </motion.div>
          )}
        </AnimatePresence>

        {showWellnessModal && (
          <UpdateWellness
            onClose={() => {
              setShowWellnessModal(false);
              fetchTodayDoses();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DoseTracker;
