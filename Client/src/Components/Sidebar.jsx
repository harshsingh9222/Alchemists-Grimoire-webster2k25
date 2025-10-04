"use client"
import { Link, useLocation } from "react-router-dom"
import { Home, User, Settings, FileText, BarChart3, Calendar, Mail, X ,Code} from 'lucide-react'

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()

  const sidebarItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "About", path: "/about", icon: User },
    { name: "Code Editor", path: "/test-editor", icon: Code },
    { name: "ADD-PROBLEM", path: "/analytics", icon: BarChart3 },
    { name: "ProblemSet", path: "/problems", icon: FileText },
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Profile", path: "/profile", icon: Mail },
    { name: "Settings", path: "/settings", icon: Settings },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg border-r border-gray-200 z-50 sidebar-transition lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
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
                <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                <p className="text-xs text-gray-500 truncate">john@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
