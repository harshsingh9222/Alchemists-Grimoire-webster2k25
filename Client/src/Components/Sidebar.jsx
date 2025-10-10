"use client";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  User,
  Calendar,
  Info,
  X,
  Pill,
  ClipboardCheck,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import PropTypes from "prop-types";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const user = useSelector((state) => state.auth.userData);

  const sidebarItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "About", path: "/about", icon: Info },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "MEDS", path: "/medicine-form", icon: Pill },
    { name: "Dose Tracker", path: "/dose-tracker", icon: ClipboardCheck },
    { name: "Chatty Chat", path: "/chat-bot", icon: MessageSquare },
    { name: "Catalog", path: "/catalog", icon: BookOpen },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="site-sidebar"
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 
        bg-gradient-to-b from-[#3b007d]/30 to-[#2a004d]/50 
        shadow-lg border-r border-purple-900/40 backdrop-blur-md 
        z-[9998] transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0`}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-wide">
              Navigation
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-purple-300 hover:text-white hover:bg-purple-800/20 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-purple-900/40 text-yellow-400 border-r-2 border-yellow-400"
                        : "text-purple-200 hover:text-white hover:bg-purple-800/20"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-purple-900/30">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-900/10 hover:bg-purple-800/20 transition-colors duration-200">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fullname || user?.username || "John Doe"}
                </p>
                <p className="text-xs text-purple-200 truncate">
                  {user?.email || "john@example.com"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
};

export default Sidebar;
