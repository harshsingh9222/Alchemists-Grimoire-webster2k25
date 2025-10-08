import { useState } from "react";
import PropTypes from "prop-types";
import { Sparkles, Zap, Activity, Heart, Moon, Star } from "lucide-react";
import { motion } from "framer-motion";
import { doseService } from "../../Services/doseServices";

const UpdateWellness = ({ onClose }) => {
  const [wellness, setWellness] = useState({
    energy: 50,
    focus: 50,
    mood: 50,
    sleep: 50,
    vitality: 50,
    balance: 50,
  });
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  const metrics = [
    { key: "energy", label: "Energy", icon: Zap },
    { key: "focus", label: "Focus", icon: Activity },
    { key: "mood", label: "Mood", icon: Heart },
    { key: "sleep", label: "Sleep", icon: Moon },
    { key: "vitality", label: "Vitality", icon: Star },
    { key: "balance", label: "Balance", icon: Activity },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { metrics: wellness, notes, date: new Date() };
      await doseService.updateWellness(payload);
      onClose();
    } catch (err) {
      console.error("Error saving wellness:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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

        <div className="space-y-5 mb-6">
          {metrics.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-purple-300" />
                  <span className="text-purple-200 font-medium">{label}</span>
                </div>
                <span className="text-purple-400 font-semibold">
                  {wellness[key]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wellness[key]}
                onChange={(e) =>
                  setWellness((p) => ({ ...p, [key]: e.target.value }))
                }
                className="w-full accent-purple-500"
              />
            </div>
          ))}
        </div>

        <textarea
          className="w-full bg-purple-950/50 border border-purple-700/40 rounded-lg text-purple-100 p-3 mb-4"
          placeholder="Add notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-purple-900/50 rounded-lg text-purple-300 hover:bg-purple-800/50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
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
