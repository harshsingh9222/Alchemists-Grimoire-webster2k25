import React, { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Pill,
    Calendar,
    TrendingUp,
    Heart,
    Star,
    Zap,
    Moon,
    Sun,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Activity
} from 'lucide-react';
import { doseService } from '../../Services/doseServices';

// ============================================
// DOSE TRACKER COMPONENT
// ============================================
const DoseTracker = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [doses, setDoses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [medicines, setMedicines] = useState([]);
    const [showWellnessModal, setShowWellnessModal] = useState(false);

    useEffect(() => {
        (async () => {
            await fetchDosesForDate(selectedDate);
            await fetchMedicinesInDose();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    // Poll backend every minute to check for pending doses that should be marked missed
    useEffect(() => {
        let cancelled = false;

        const checkPendingDoses = async () => {
            try {
                const data = await doseService.checkPendingDoses();

                // If backend reports updates (missed doses), refresh the UI list for the selected date
                if (!cancelled && (data?.updated || (data?.missedCount && data.missedCount > 0))) {
                    console.log('checkPendingDoses: updates detected, refreshing doses', data);
                    await fetchDosesForDate(selectedDate);
                }
            } catch (err) {
                console.error('checkPendingDoses error:', err);
            }
        };

        // Run immediately once, then every minute
        checkPendingDoses();
        const id = setInterval(checkPendingDoses, 30 * 1000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [selectedDate]);

    const fetchMedicinesInDose = async () => {
        try {
            const resdata = await doseService.getMedicines();
            // Normalize medicines to an array
            const meds = Array.isArray(resdata)
                ? resdata
                : Array.isArray(resdata?.medicines)
                    ? resdata.medicines
                    : Array.isArray(resdata?.data)
                        ? resdata.data
                        : [];
            // Debug shape if unexpected
            if (!Array.isArray(resdata) && !Array.isArray(resdata?.medicines) && !Array.isArray(resdata?.data)) {
                // eslint-disable-next-line no-console
                console.debug('fetchMedicinesInDose: unexpected response shape', resdata);
            }
            setMedicines(meds);
        } catch (error) {
            console.error('Error fetching medicines:', error);
        }
    };

    // returns doses (so callers can use the fresh array)
    const fetchDosesForDate = async (date) => {
        setLoading(true);
        try {
            const resdata = await doseService.getDosesByDate(date);
            // Normalize into an array regardless of backend shape
            const fetched = Array.isArray(resdata)
                ? resdata
                : Array.isArray(resdata?.doses)
                    ? resdata.doses
                    : Array.isArray(resdata?.data)
                        ? resdata.data
                        : [];

            if (!Array.isArray(fetched)) {
                // eslint-disable-next-line no-console
                console.debug('fetchDosesForDate: normalized fetched is not array', resdata);
            }

            setDoses(fetched);
            return fetched;
        } catch (error) {
            console.error('Error fetching doses:', error);
            setDoses([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleDoseAction = async (doseId, action, medicineId, scheduledTime) => {
        try {
            const payload = doseId
                ? { doseId, status: action === 'take' ? 'taken' : 'skipped' }
                : { medicineId, scheduledTime, status: action === 'take' ? 'taken' : 'skipped' };

            // single service method to update dose status
            await doseService.updateDoseStatus(payload);

            // Refresh doses and then check completion using the fresh array
            const fresh = await fetchDosesForDate(selectedDate);
            showSuccessAnimation(action);

            // Check if all doses are taken for today (use fresh data)
            const allTaken = fresh.length > 0 && fresh.every(d => d.status === 'taken');
            if (allTaken) setShowWellnessModal(true);
        } catch (error) {
            console.error('Error recording dose:', error);
        }
    };

    const showSuccessAnimation = (action) => {
        // Create a floating sparkle effect
        const sparkle = document.createElement('div');
        sparkle.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-6xl animate-ping';
        sparkle.innerHTML = action === 'take' ? '✨' : '⏭️';
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
    };

    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + direction);
        setSelectedDate(newDate);
    };

    // robustly decide hour from either "HH:mm" or ISO datetime
    const getTimeIcon = (time) => {
        let hour = 0;
        if (!time) return Sun;
        if (typeof time === 'string' && /^\d{1,2}:\d{2}$/.test(time)) {
            hour = parseInt(time.split(':')[0], 10);
        } else {
            const d = new Date(time);
            if (!isNaN(d)) hour = d.getHours();
        }

        if (hour < 6) return Moon;
        if (hour < 12) return Sun;
        if (hour < 18) return Sun;
        return Moon;
    };

    const formatDate = (date) => {
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) return 'Today';
        if (isYesterday) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 p-6">
            {/* Magical Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${i * 2}s`,
                            animationDuration: `${15 + i * 5}s`
                        }}
                    >
                        <Sparkles className="w-8 h-8 text-purple-300/20" />
                    </div>
                ))}
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
                            🧪 Potion Tracker
                        </span>
                    </h1>
                    <p className="text-purple-300/70">Track your magical elixirs and mark them as taken</p>
                </div>

                {/* Date Navigator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <button
                        onClick={() => navigateDate(-1)}
                        className="p-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="px-6 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-300" />
                            <span className="text-lg font-semibold text-purple-200">
                                {formatDate(selectedDate)}
                            </span>
                        </div>
                        <div className="text-xs text-purple-400 mt-1 text-center">
                            {selectedDate.toLocaleDateString()}
                        </div>
                    </div>

                    <button
                        onClick={() => navigateDate(1)}
                        className="p-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 transition-all"
                        disabled={selectedDate.toDateString() === new Date().toDateString()}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={() => setSelectedDate(new Date())}
                        className="p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-xl border border-purple-500/30 hover:scale-105 transition-all"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Clock className="w-5 h-5 text-purple-300" />
                            <span className="text-purple-200 font-medium">Today's Doses</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowWellnessModal(true)}
                        className="p-4 bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-xl border border-pink-500/30 hover:scale-105 transition-all"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Heart className="w-5 h-5 text-pink-300" />
                            <span className="text-pink-200 font-medium">Update Wellness</span>
                        </div>
                    </button>

                    <button className="p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/30 hover:scale-105 transition-all">
                        <div className="flex items-center justify-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-300" />
                            <span className="text-indigo-200 font-medium">View Progress</span>
                        </div>
                    </button>
                </div>

                {/* Doses Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                    </div>
                ) : doses.length === 0 ? (
                    <div className="text-center py-12">
                        <Pill className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                        <p className="text-purple-300">No potions scheduled for this day</p>
                        {medicines.length === 0 && (
                            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-all">
                                Add Your First Potion
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doses.map((dose) => {
                            const TimeIcon = getTimeIcon(dose.time || dose.scheduledTime);
                            const isComplete = dose.status === 'taken';
                            const isMissed = dose.status === 'missed';
                            const isPending = dose.status === 'pending';

                            return (
                                <div
                                    key={dose._id || `${dose.medicineId}-${dose.time}`}
                                    className={`relative group overflow-hidden bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-indigo-950/90 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 transition-all hover:scale-[1.02] ${isComplete ? 'ring-2 ring-green-500/50' : ''
                                        }`}
                                >
                                    {/* Sparkles for completed doses */}
                                    {isComplete && (
                                        <div className="absolute top-2 right-2 animate-pulse">
                                            <Sparkles className="w-6 h-6 text-yellow-300" />
                                        </div>
                                    )}

                                    {/* Medicine Info */}
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
                                            <TimeIcon className="w-5 h-5 text-purple-400" />
                                            <span className="text-purple-300 font-medium">
                                                {dose.time || new Date(dose.scheduledTime).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mb-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isComplete ? 'bg-green-500/20 text-green-300' :
                                                isMissed ? 'bg-red-500/20 text-red-300' :
                                                    'bg-gray-500/20 text-gray-300'
                                            }`}>
                                            {isComplete && <CheckCircle className="w-3 h-3" />}
                                            {isMissed && <XCircle className="w-3 h-3" />}
                                            {isPending && <AlertCircle className="w-3 h-3" />}
                                            {dose.status || 'Pending'}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    {!isComplete && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDoseAction(
                                                    dose._id,
                                                    'take',
                                                    dose.medicineId || dose.medicine?._id,
                                                    dose.scheduledTime
                                                )}
                                                className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105"
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium">Take</span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleDoseAction(
                                                    dose._id,
                                                    'skip',
                                                    dose.medicineId || dose.medicine?._id,
                                                    dose.scheduledTime
                                                )}
                                                className="flex-1 py-2 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all transform hover:scale-105"
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
                                            <span className="text-green-400 font-medium">✨ Potion Consumed!</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Wellness Modal */}
                {showWellnessModal && (
                    <WellnessModal onClose={() => setShowWellnessModal(false)} />
                )}
            </div>
        </div>
    );
};

// ============================================
// WELLNESS MODAL COMPONENT
// ============================================
const WellnessModal = ({ onClose }) => {
    const [wellness, setWellness] = useState({
        energy: 50,
        focus: 50,
        mood: 50,
        sleep: 50,
        vitality: 50,
        balance: 50
    });
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const metrics = [
        { key: 'energy', label: 'Energy', icon: Zap, color: 'yellow' },
        { key: 'focus', label: 'Focus', icon: Activity, color: 'blue' },
        { key: 'mood', label: 'Mood', icon: Heart, color: 'pink' },
        { key: 'sleep', label: 'Sleep', icon: Moon, color: 'indigo' },
        { key: 'vitality', label: 'Vitality', icon: Star, color: 'green' },
        { key: 'balance', label: 'Balance', icon: Activity, color: 'purple' }
    ];

    const handleSliderChange = (metric, value) => {
        setWellness(prev => ({ ...prev, [metric]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                metrics: wellness,
                notes,
                date: new Date().toISOString()
            };

            const resp = await doseService.updateWellness(payload);

            // Show success animation
            const sparkle = document.createElement('div');
            sparkle.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-6xl animate-ping';
            sparkle.innerHTML = '🌟';
            document.body.appendChild(sparkle);

            setTimeout(() => {
                sparkle.remove();
                onClose();
            }, 1000);

            return resp; // optional: return server response if caller needs it
        } catch (error) {
            // normalize axios errors if needed
            const message = error?.response?.data?.message || error.message || 'Error saving wellness';
            console.error('Error saving wellness:', message);
            // optionally show a toast or alert here:
            // toast.error(message);
            alert(message);
        } finally {
            setSaving(false);
        }
    };


    const getEmoji = (value) => {
        if (value < 30) return '😔';
        if (value < 50) return '😐';
        if (value < 70) return '🙂';
        if (value < 90) return '😊';
        return '🤩';
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-8 max-w-2xl w-full border border-purple-500/30 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
                            How are you feeling today?
                        </span>
                    </h2>
                    <p className="text-purple-400">Adjust the sliders to match your current state</p>
                </div>

                {/* Metrics Grid */}
                <div className="space-y-6 mb-6">
                    {metrics.map(({ key, label, icon: Icon, color }) => (
                        <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-5 h-5 text-${color}-400`} />
                                    <span className="text-purple-200 font-medium">{label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getEmoji(wellness[key])}</span>
                                    <span className={`text-${color}-400 font-bold`}>{wellness[key]}%</span>
                                </div>
                            </div>

                            <div className="relative">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={wellness[key]}
                                    onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                                    className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                        background: `linear-gradient(to right, #a78bfa 0%, #ec4899 ${wellness[key]}%, #4c1d95 ${wellness[key]}%, #4c1d95 100%)`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Notes */}
                <div className="mb-6">
                    <label className="block text-purple-300 mb-2">Notes (optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How was your day? Any side effects or observations?"
                        className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                        rows="3"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 bg-purple-900/50 text-purple-300 rounded-lg hover:bg-purple-800/50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                        {saving ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
            </div>

            {/* Custom slider styles */}
            <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #a78bfa, #ec4899);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 10px rgba(167, 139, 250, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #a78bfa, #ec4899);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 10px rgba(167, 139, 250, 0.5);
        }
      `}</style>
        </div>
    );
};

export default DoseTracker;
