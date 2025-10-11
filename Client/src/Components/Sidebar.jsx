"use client"
import { Link, useLocation } from "react-router-dom"
import { useSelector } from 'react-redux'
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
// ...existing code...
import PropTypes from "prop-types";



const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()
  const user = useSelector((state) => state.auth.userData)

  const sidebarItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Notifications", path: "/notifications", icon: MessageSquare },
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
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div
          className={`fixed left-0 top-0 h-screen w-64 bg-white shadow-lg border-r border-gray-200 z-50 sidebar-transition lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* keep content below the fixed navbar height (4rem) */}
          <div className="flex flex-col h-full pt-16">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-2 px-3">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.fullname || user?.username || 'John Doe'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'john@example.com'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
  )
}

Sidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
};

export default Sidebar
