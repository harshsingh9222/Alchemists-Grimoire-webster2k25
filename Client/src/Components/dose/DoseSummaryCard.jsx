import React from "react";
import PropTypes from "prop-types";
import { Clock, Pill } from "lucide-react";

const DoseSummaryCard = ({ time, medicines }) => {
  return (
    <div className="bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 rounded-xl border border-indigo-500/30 p-6 shadow-lg hover:scale-[1.02] transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-300" />
          <h3 className="text-indigo-200 font-semibold">{time}</h3>
        </div>
      </div>

      <ul className="space-y-2">
        {medicines.map((med, i) => {
          const isMissed = med.status === 'missed';
          return (
            <li
              key={i}
              className={`flex items-center gap-2 text-purple-200 p-2 rounded-lg ${
                isMissed ? 'bg-red-900/50 border border-red-600/30 text-red-200' : 'bg-purple-950/50'
              }`}
            >
              <Pill className={`w-4 h-4 ${isMissed ? 'text-red-400' : 'text-pink-400'}`} />
              <span className={isMissed ? 'line-through opacity-80' : ''}>{med.name}</span>
              <span className={`text-sm ml-auto ${isMissed ? 'text-red-200' : 'text-purple-400'}`}>
                {med.status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DoseSummaryCard;

DoseSummaryCard.propTypes = {
  time: PropTypes.string.isRequired,
  medicines: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      status: PropTypes.string,
    })
  ).isRequired,
};
