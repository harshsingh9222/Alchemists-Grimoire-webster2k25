import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Sparkles, Zap, Activity, Heart, Moon, Star } from "lucide-react";
import { motion } from "framer-motion";
import { doseService } from "../../Services/doseServices";

const UpdateWellness = ({ onClose }) => {
  const defaultMetrics = {
    energy: 50,
    focus: 50,
    mood: 50,
    sleep: 50,
    vitality: 50,
    balance: 50,
  };

  const [wellness, setWellness] = useState(defaultMetrics);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const metrics = [
    { key: "energy", label: "Energy", icon: Zap },
    { key: "focus", label: "Focus", icon: Activity },
    { key: "mood", label: "Mood", icon: Heart },
    { key: "sleep", label: "Sleep", icon: Moon },
    { key: "vitality", label: "Vitality", icon: Star },
    { key: "balance", label: "Balance", icon: Activity },
  ];

  const getLocalDateStr = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}-${month}-${day}`;
  };

  const loadToday = async ({ showErrors = false } = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await doseService.getTodayWellness();
      // Expect { metrics: {...}, notes: "..." } OR a flat object
      if (res?.metrics) {
        const normalized = {};
        Object.keys(defaultMetrics).forEach((k) => {
          const val = res.metrics[k];
          normalized[k] = typeof val === "number" ? val : Number(val ?? defaultMetrics[k]);
        });
        setWellness((p) => ({ ...p, ...normalized }));
      } else if (res && typeof res === "object") {
        // flat shape fallback
        const normalized = {};
        Object.keys(defaultMetrics).forEach((k) => {
          const val = res[k];
          if (val !== undefined) normalized[k] = Number(val);
        });
        if (Object.keys(normalized).length) setWellness((p) => ({ ...p, ...normalized }));
      } else {
        // no data -> keep defaults
        setWellness(defaultMetrics);
      }

      if (typeof res?.notes === "string") {
        setNotes(res.notes);
      } else if (typeof res?.note === "string") {
        setNotes(res.note);
      }
    } catch (err) {
      console.error("Failed to load today's wellness:", err);
      if (showErrors) setError("Failed to load today's wellness. Try again.");
      // keep previous or default values
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadToday();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        metrics: wellness,
        notes,
        date: getLocalDateStr(new Date()),
      };
      await doseService.updateWellness(payload);
      setSuccess("Saved successfully.");
      // small delay to show success, then close
      setTimeout(() => {
        onClose();
      }, 450);
    } catch (err) {
      console.error("Error saving wellness:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    // reload today's server values (show error if fails)
    await loadToday({ showErrors: true });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-8 max-w-2xl w-full border border-purple-500/30 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-center text-3xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
          🌟 How are you feeling today?
        </h2>

        {/* Inline Alerts */}
        {error && (
          <div className="mb-4 rounded-md border border-red-600 bg-red-900/30 text-red-200 p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-600 bg-green-900/30 text-green-200 p-3">
            {success}
          </div>
        )}

        {loading ? (
          <div className="py-8 flex items-center justify-center text-purple-300">
            <div className="animate-spin h-6 w-6 border-b-2 border-purple-300 rounded-full mr-3" />
            Loading today's wellness...
          </div>
        ) : (
          <>
            <div className="space-y-5 mb-6">
              {metrics.map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-purple-300" />
                      <span className="text-purple-200 font-medium">{label}</span>
                    </div>
                    <span className="text-purple-400 font-semibold">{wellness[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={wellness[key]}
                    onChange={(e) =>
                      setWellness((p) => ({ ...p, [key]: Number(e.target.value) }))
                    }
                    className="w-full accent-purple-500"
                    aria-label={`${label} slider`}
                  />
                </div>
              ))}
            </div>

            <textarea
              className="w-full bg-purple-950/50 border border-purple-700/40 rounded-lg text-purple-100 p-3 mb-4"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </>
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            className="py-3 px-4 bg-purple-900/50 rounded-lg text-purple-300 hover:bg-purple-800/50 transition"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            onClick={handleReset}
            className="py-3 px-4 bg-purple-800/40 rounded-lg text-purple-200 hover:bg-purple-800/50 transition"
            disabled={loading || saving}
            title="Reload today's values from server"
          >
            Reset to today's values
          </button>

          <div className="flex-1" />

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`py-3 px-6 ${
              saving || loading ? "opacity-70 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-pink-500"
            } text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Save Wellness
              </span>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UpdateWellness;

UpdateWellness.propTypes = {
  onClose: PropTypes.func.isRequired,
};
