"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

export const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
  // Initialize from localStorage (User preferred over Admin)
  const [authUser, setAuthUser] = useState(() => {
    try {
      const userData = localStorage.getItem("User")
      if (userData) return JSON.parse(userData)

      const adminData = localStorage.getItem("Admin")
      if (adminData) return JSON.parse(adminData)

      return null
    } catch (error) {
      console.error("Error parsing auth data from localStorage:", error)
      localStorage.removeItem("User")
      localStorage.removeItem("Admin")
      return null
    }
  })

  // Centralized storage sync
  const updateLocalStorage = useCallback((user) => {
    try {
      if (user) {
        const isAdmin = user.role === "admin" || user.role === "Admin"
        if (isAdmin) {
          localStorage.setItem("Admin", JSON.stringify(user))
          localStorage.removeItem("User")
        } else {
          localStorage.setItem("User", JSON.stringify(user))
          localStorage.removeItem("Admin")
        }
      } else {
        localStorage.removeItem("User")
        localStorage.removeItem("Admin")
      }
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }
  }, [])

  // Wrapped setter that also syncs storage
  const setAuthUserWithStorage = useCallback(
    (user) => {
      setAuthUser(user)
      updateLocalStorage(user)
    },
    [updateLocalStorage],
  )

  // Sync storage when state changes (covers any direct setAuthUser call)
  useEffect(() => {
    updateLocalStorage(authUser)
  }, [authUser, updateLocalStorage])

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "User" || e.key === "Admin") {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null
          setAuthUser(newValue)
        } catch (error) {
          console.error("Storage change parse error:", error)
          setAuthUser(null)
        }
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:4000/user/logout", {
        method: "POST",
        credentials: "include",
      })
      setAuthUser(null)
      if (response.ok) {
        return { success: true, message: "Logout successful" }
      } else {
        const data = await response.json()
        return { success: false, message: data.message || "Logout failed" }
      }
    } catch (error) {
      console.error("Logout error:", error)
      setAuthUser(null)
      return { success: false, message: "Network error during logout" }
    }
  }, [])

  // Derived values (booleans)
  const isAdmin = authUser?.role?.toLowerCase?.() === "admin"
  const isAuthenticated = !!authUser

  const contextValue = {
    authUser,
    setAuthUser: setAuthUserWithStorage,
    logout,
    isAdmin,
    isAuthenticated,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
