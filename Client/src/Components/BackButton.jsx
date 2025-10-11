import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ fallback = -1, className = "" }) => {
  const navigate = useNavigate();
  const goBack = () => {
    try {
      if (typeof fallback === "string") navigate(fallback);
      else navigate(fallback); // number -1 will go back
    } catch (err) {
      // fallback to history back
      window.history.back();
    }
  };

  return (
    <button
      onClick={goBack}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-700/70 hover:bg-purple-700/90 text-white shadow-md ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Back</span>
    </button>
  );
};

export default BackButton;
