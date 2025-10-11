// React not required to be imported for JSX runtime
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, Info, Bell, MoreHorizontal } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { loadUpcomingRisks } from "../store/notificationsSlice";
import { performLogout } from "../store/authAction";
import { toast } from "react-hot-toast";
import PropTypes from "prop-types";
import path from "../assets/Images/cure_it_logo.png";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const user = auth?.userData;
  const risks = useSelector((s) => s.notifications?.risks || []);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);
  const notifRef = useRef(null);

  const navItems = [
    { name: "Home", path: "/home", icon: Home },
    { name: "About", path: "/about", icon: Info },
  ];

  const handleLogout = async () => {
    try {
      const ok = await dispatch(performLogout());
      if (ok) toast.success("Logged out");
      else toast.success("Logged out (client)");
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Logout failed");
    }
  };

  // Poll for upcoming risks every 60s when user is logged in
  useEffect(() => {
    let timer = null;
    if (user) {
      dispatch(loadUpcomingRisks());
      timer = setInterval(() => {
        dispatch(loadUpcomingRisks());
      }, 300 * 1000); // had changes it to 300s
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user, dispatch]);

  // Close mobile menu on outside click or ESC
  useEffect(() => {
    function handleClickOutside(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    }

    function handleEsc(e) {
      if (e.key === "Escape") setShowMobileMenu(false);
    }

    if (showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showMobileMenu]);

  // Close notifications panel on outside click or ESC
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPopup(false);
      }
    }

    function handleEsc(e) {
      if (e.key === "Escape") setShowNotifPopup(false);
    }

    if (showNotifPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showNotifPopup]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[9999] h-16 
      bg-gradient-to-r from-purple-800/60 to-purple-900/60 
      backdrop-blur-md border-b border-purple-900/40 shadow-md transition-all duration-300"
      >
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-full w-full">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-expanded={sidebarOpen}
              aria-controls="site-sidebar"
              aria-label="Toggle navigation"
              className="p-2 rounded-md text-purple-200 hover:text-white hover:bg-purple-900/30 transition-colors duration-200 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer bg-gradient-to-r from-yellow-300 to-red-400 shadow-sm">
                <img
                  src={path}
                  alt="Cure-It logo"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Cure-It
              </span>
            </Link>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-yellow-400 bg-purple-900/40"
                      : "text-purple-200 hover:text-white hover:bg-purple-900/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border border-purple-300/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 border border-gray-300">
                    {user.fullname
                      ? user.fullname
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                      : (user.email || "U")[0].toUpperCase()}
                  </div>
                )}

                {/* Notifications placeholder - floating button rendered separately */}

                {/* Mobile menu toggle (shows Home/About/Logout) */}
                <div className="relative lg:hidden">
                  <button
                    onClick={() => setShowMobileMenu((s) => !s)}
                    className="ml-2 p-2 rounded-md text-purple-200 hover:text-white hover:bg-purple-900/20"
                    aria-label="Open menu"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  {showMobileMenu && (
                    <div
                      ref={mobileMenuRef}
                      role="menu"
                      aria-label="Mobile menu"
                      className="absolute right-0 mt-2 w-44 bg-gradient-to-b from-purple-800/95 to-purple-900/100 text-white rounded-md shadow-xl z-50 overflow-hidden border border-purple-700/60"
                    >
                      <Link
                        to="/home"
                        role="menuitem"
                        onClick={() => setShowMobileMenu(false)}
                        className="block px-4 py-3 hover:bg-purple-900/40 cursor-pointer text-sm"
                      >
                        Home
                      </Link>
                      <Link
                        to="/about"
                        role="menuitem"
                        onClick={() => setShowMobileMenu(false)}
                        className="block px-4 py-3 hover:bg-purple-900/40 cursor-pointer text-sm"
                      >
                        About
                      </Link>
                      <div className="border-t border-purple-700/40" />
                      <button
                        role="menuitem"
                        onClick={() => {
                          setShowMobileMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-3 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
                {/* Logout (desktop only) */}
                <div className="hidden lg:block">
                  <button
                    onClick={handleLogout}
                    className="ml-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-all duration-200 border border-red-700/70"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-purple-200 hover:text-white hover:bg-purple-900/20 rounded-md transition-colors duration-200 border border-purple-700/30"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-300 hover:to-red-600 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Floating notification button + panel */}
      <div className="fixed bottom-6 right-6 z-[99999]">
        <div className="relative">
          <button
            onClick={() => setShowNotifPopup((s) => !s)}
            aria-label="Notifications"
            className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-700 to-purple-900 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Bell className="w-6 h-6" />
          </button>
          {risks && risks.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {risks.length}
            </span>
          )}

          {showNotifPopup && (
            <div
              ref={notifRef}
              className="mt-3 w-96 max-w-sm bg-gradient-to-b from-purple-800/95 to-purple-900/100 text-white rounded-md shadow-2xl z-50 overflow-hidden border border-purple-700/60"
            >
              <div className="p-3 border-b border-purple-700/40 font-semibold">
                Notifications
              </div>
              <div className="max-h-64 overflow-auto">
                {risks.length === 0 ? (
                  <div className="p-3 text-purple-200">No notifications</div>
                ) : (
                  risks.map((r) => (
                    <div
                      key={r.doseId}
                      className="p-3 hover:bg-purple-900/30 border-b last:border-b-0"
                    >
                      <div className="font-semibold text-white">
                        {r.medicineName}
                      </div>
                      <div className="text-xs text-purple-200">
                        {r.slot} — Miss rate:{" "}
                        {Math.round((r.missedProb || 0) * 100)}%
                      </div>
                      <div className="text-xs text-purple-200">
                        Scheduled:{" "}
                        {new Date(r.scheduledTime).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

Navbar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
};

export default Navbar;
