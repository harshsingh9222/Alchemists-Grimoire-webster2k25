import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { motion } from "framer-motion";
import { LogOut, User } from "lucide-react";

export default function ProfilePage() {
  const { userData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 text-white">
        <div className="text-center">
          <p className="text-2xl font-semibold mb-2">You’re not logged in</p>
          <p className="opacity-75 text-sm">
            Please log in to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-white/10"
      >
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-4 rounded-full shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Name */}
        <h2 className="text-white text-2xl font-bold mb-1">
          {userData?.username || "User"}
        </h2>
        <p className="text-gray-300 text-sm mb-6">
          {userData?.email || "No email provided"}
        </p>

        {/* Character info */}
        <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/10">
          <p className="text-gray-200 text-sm mb-2">Selected Character</p>
          <p className="text-xl font-semibold text-yellow-300 flex justify-center items-center gap-2">
            {userData?.character ? (
              <>
                <span className="text-2xl">
                  {
                    // if you have emojis or icons mapped
                    (userData.character === "magician" && "🪄") ||
                      (userData.character === "acrobat" && "🤸") ||
                      (userData.character === "beastmaster" && "🐯") ||
                      (userData.character === "illusionist" && "🌙")
                  }
                </span>
                {userData.character.charAt(0).toUpperCase() +
                  userData.character.slice(1)}
              </>
            ) : (
              <span className="text-gray-400">No character selected</span>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
