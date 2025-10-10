import React, { useEffect, useState } from "react";
import { fetchCatalog, getAISuggestion } from "../api";
import { useNavigate } from "react-router-dom";

const CatalogPage = () => {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feeling, setFeeling] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetchCatalog();
        setCatalog(res.data);
      } catch (err) {
        console.error("Failed to fetch catalog:", err);
        setError("Failed to load catalog");
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleAISuggest = async () => {
    if (!feeling.trim()) return;
    setSuggestion(null);
    setError("");

    try {
      const res = await getAISuggestion(feeling);
      setSuggestion(res.suggestion);
    } catch (err) {
      console.error("AI Suggestion error:", err);
      setError("Failed to get AI suggestion");
    }
  };

  const handleAddToMedicine = () => {
    if (!suggestion) return;
    navigate("/medicine-form", { state: { suggestion } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4b0082] to-[#2a004d] text-white py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center flex items-center justify-center gap-2">
          ✨ Medicine Catalog ✨
        </h1>
        <p className="text-center text-purple-200 mb-10 max-w-xl mx-auto">
          Harness the power of ancient remedies and smart AI to enhance your
          wellness journey 🌿
        </p>

        {/* Catalog Section */}
        {loading ? (
          <p className="text-center">Loading catalog...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {catalog.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 shadow-lg border border-purple-400/30 hover:scale-105 transition-transform relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-purple-400/10 blur-3xl"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold mb-2">
                    {item.medicineName}
                  </h2>
                  <p className="text-sm text-purple-200 mb-3">
                    {item.description}
                  </p>
                  <p>
                    <span className="font-medium text-purple-100">
                      💊 Dosage:
                    </span>{" "}
                    {item.dosage}
                  </p>
                  <p>
                    <span className="font-medium text-purple-100">
                      ⏳ Frequency:
                    </span>{" "}
                    {item.frequency}
                  </p>
                  <p>
                    <span className="font-medium text-purple-100">
                      🕓 Time:
                    </span>{" "}
                    {item.defaultTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Suggestion Section */}
        <div className="mt-8 bg-gradient-to-br from-purple-700/60 to-indigo-800/60 backdrop-blur-md p-6 rounded-2xl border border-purple-400/30 shadow-lg">
          <h2 className="text-3xl font-semibold mb-3 flex items-center gap-2">
            🤖 AI Suggestion
          </h2>
          <p className="text-purple-200 mb-4">
            Tell me how you're feeling today, and I’ll suggest the perfect
            remedy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. I'm feeling tired and low on energy"
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="flex-1 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAISuggest}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition"
            >
              ✨ Get Suggestion
            </button>
          </div>

          {suggestion && (
            <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-800 border border-purple-400/30 shadow-lg">
              <h3 className="text-xl font-bold mb-2">
                🩺 {suggestion.medicineName}
              </h3>
              <p className="text-sm text-purple-200 mb-2">
                {suggestion.description}
              </p>
              <p>
                <strong>💊 Dosage:</strong> {suggestion.dosage}
              </p>
              <p>
                <strong>⏳ Frequency:</strong> {suggestion.frequency}
              </p>
              <p>
                <strong>🕓 Time:</strong> {suggestion.defaultTime}
              </p>
              {suggestion.reason && (
                <p className="mt-3 italic text-purple-300">
                  💬 {suggestion.reason}
                </p>
              )}

              <button
                onClick={handleAddToMedicine}
                className="mt-4 w-full bg-pink-600 hover:bg-pink-500 transition-all p-2 rounded-lg font-semibold"
              >
                ➕ Add to My Medicines
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
