// React not required to be imported for JSX runtime
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Home, User, Mail, Bell } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { useEffect, useState } from 'react'
import { loadUpcomingRisks } from '../store/notificationsSlice'
import { useNavigate } from "react-router-dom"
import { performLogout } from "../store/authAction"
import { toast } from "react-hot-toast"
import PropTypes from "prop-types";
import path from "../assets/Images/cure_it_logo.png"

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()

  const navItems = [
    { name: "Home", path: "/home", icon: Home },
    { name: "About", path: "/about", icon: User },
    
  ]

  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user = auth?.userData
  const risks = useSelector(s => s.notifications?.risks || [])
  const notifLoading = useSelector(s => s.notifications?.loading)
  const [showNotifPopup, setShowNotifPopup] = useState(false)

  const handleLogout = async () => {
    try {
      const ok = await dispatch(performLogout())
      if (ok) toast.success('Logged out')
      else toast.success('Logged out (client)')
      navigate('/')
    } catch (err) {
      console.error('Logout failed', err)
      toast.error('Logout failed')
    }
  }

  // Poll for upcoming risks every 60s when user is logged in
  useEffect(() => {
    let timer = null
    if (user) {
      console.debug('Navbar: dispatching loadUpcomingRisks')
      dispatch(loadUpcomingRisks())
      timer = setInterval(() => {
        console.debug('Navbar: interval dispatching loadUpcomingRisks')
        dispatch(loadUpcomingRisks())
      }, 60 * 1000)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [user, dispatch])

  useEffect(() => {
    console.debug('Navbar: risks changed', risks)
  }, [risks])

  return (
      <nav className="bg-white shadow-lg border-b border-gray-200 fixed w-full top-0 z-[9999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-red-600 rounded-xl flex items-center justify-center cursor-zoom-in">
                  <span className="text-white font-bold text-sm"><img src={path} alt="" className="w-9 h-9 rounded-full object-cover" /></span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  Cure-It
                </span>
              </Link>
            </div>

            {/* Center nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      location.pathname === item.path
                        ? "text-yellow-600 bg-yellow-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Right (Login / Signup or Profile) */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                      {user.fullname ? user.fullname.split(' ').map(n=>n[0]).slice(0,2).join('') : (user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {/* Notification bell */}
                  <div className="relative">
                    <button onClick={() => setShowNotifPopup(s => !s)} className="ml-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                      <Bell className="w-5 h-5" />
                    </button>
                    {risks && risks.length > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{risks.length}</span>
                    )}
                    {showNotifPopup && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 text-sm text-gray-800">
                        <div className="p-3 border-b font-semibold">Notifications</div>
                        <div className="max-h-64 overflow-auto">
                          {risks.length === 0 ? (
                            <div className="p-3 text-gray-500">No notifications</div>
                          ) : (
                            risks.map(r => (
                              <div key={r.doseId} className="p-3 hover:bg-gray-50 border-b">
                                <div className="font-semibold">{r.medicineName}</div>
                                <div className="text-xs text-gray-500">{r.slot} — Miss rate: {Math.round((r.missedProb||0)*100)}%</div>
                                <div className="text-xs text-gray-500">Scheduled: {new Date(r.scheduledTime).toLocaleTimeString()}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleLogout} className="ml-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">Logout</button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-red-600 hover:from-yellow-300 hover:to-red-700 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
  )
}

Navbar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
};

export default Navbar
