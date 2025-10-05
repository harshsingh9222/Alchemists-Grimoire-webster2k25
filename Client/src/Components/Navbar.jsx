import React from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Home, User } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { userLogout } from "../api"
import { logout as logoutAction } from "../store/authSlice"
import { toast } from "react-hot-toast"

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "About", path: "/about", icon: User },
  ]

  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user = auth?.userData

  const handleLogout = async () => {
    try {
      await userLogout()
      dispatch(logoutAction())
      localStorage.removeItem('User')
      toast.success('Logged out')
      navigate('/')
    } catch (err) {
      console.error('Logout failed', err)
      toast.error('Logout failed')
    }
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed w-full top-0 z-50">
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">MyApp</span>
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
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
            {auth?.status && user ? (
              <div className="flex items-center space-x-3">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                    {user.fullname ? user.fullname.split(' ').map(n=>n[0]).slice(0,2).join('') : (user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
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
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
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

export default Navbar
