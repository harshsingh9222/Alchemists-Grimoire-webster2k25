"use client"
import { useState, useEffect, useCallback } from "react"
import { X, Eye, EyeOff, Mail, Lock, User, MapPin, Upload } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "../context/AuthProvider"
import { googleAuth } from "../api"

const AuthModal = ({ isOpen, onClose, type, onSwitchToSignup, onSwitchToLogin }) => {
  const navigate = useNavigate()
  const { setAuthUser } = useAuth() // ONLY what we need

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profilePreview, setProfilePreview] = useState(null)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpEmail, setOtpEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [tempUserData, setTempUserData] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm()

  const profilePicFile = watch("profilePic")

  // Lock scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
      reset()
      setProfilePreview(null)
      setShowOtpInput(false)
      setOtp("")
      setOtpEmail("")
      setTempUserData(null)
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen, reset])

  // Profile picture preview
  useEffect(() => {
    if (profilePicFile && profilePicFile.length > 0) {
      const file = profilePicFile[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setProfilePreview(null)
    }
  }, [profilePicFile])

  // Shared login logic
  const handleUserLogin = async (url, credentials, userTypeLabel) => {
    try {
      setIsLoading(true)
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      })
      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message || `${userTypeLabel} login failed`)
      }

      const userData = userTypeLabel === "Admin" ? responseData.admin : responseData.user
      if (!userData) throw new Error("Server did not return user data.")

      setAuthUser(userData)
      toast.success(`${userTypeLabel} logged in successfully!`)
      onClose()
      navigate("/")
    } catch (error) {
      console.error(`${userTypeLabel} login error:`, error)
      toast.error("Error: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Signup
  const handleSignup = async (data, isAdmin = false) => {
    try {
      setIsLoading(true)
      const endpoint = isAdmin ? "http://localhost:4000/admin/signup" : "http://localhost:4000/user/signup"

      const formData = new FormData()
      formData.append("fullname", data.fullname)
      formData.append("email", data.email)
      formData.append("password", data.password)
      formData.append("location", data.location)
      if (data.profilePic && data.profilePic.length > 0) {
        formData.append("profilePic", data.profilePic[0])
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const result = await response.json()

      if (!response.ok) {
        toast.error(`Error: ${result.message}`)
        return
      }

      const userData = isAdmin ? result.admin : result.user
      if (!userData) {
        toast.error("Signup succeeded but user data missing.")
        return
      }

      setAuthUser(userData)
      toast.success(isAdmin ? "Admin signup successful" : "User signup successful")
      onClose()
      navigate("/")
    } catch (error) {
      console.error("Signup Error:", error)
      toast.error("Something went wrong!")
    } finally {
      setIsLoading(false)
    }
  }

  // Google login
  const responseGoogle = useCallback(
    async (authResult) => {
      try {
        setIsLoading(true)
        if (authResult.code) {
          // 1. Exchange code for user info (call your backend or Google API)
          // For this example, let's assume you get the email from Google directly
          // If you need to call your backend, do so here and get the email

          // For demonstration, let's say you get the email as:
          // const email = resultFromGoogle.email;

          // But if you need to call your backend to get the email, do it here:
          // const result = await googleAuth(authResult.code);
          // const email = result.email;

          // For now, let's assume you have the email:
          const result = await googleAuth(authResult.code);
          const email = result.email || result.user?.email;
          if (!email) {
            toast.error("Could not get email from Google login.");
            return;
          }

          // 2. Send OTP to the email
          const otpRes = await fetch("http://localhost:4000/user/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email }),
          });
          const otpData = await otpRes.json();
          if (!otpRes.ok) {
            throw new Error(otpData.message || "Failed to send OTP");
          }

          setTempUserData(result.user || result); // Store user info for after OTP
          setOtpEmail(email);
          setShowOtpInput(true);
          toast.success("OTP sent to your email!");
        }
      } catch (error) {
        console.error("Google auth error:", error);
        toast.error("Google authentication failed: " + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthUser, onClose, navigate],
  )

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: responseGoogle,
    onError: (error) => {
      console.error("Google login error:", error)
      toast.error("Google login failed")
    },
  })

  // OTP verify
  const handleOtpVerify = async () => {
    if (!otp.trim()) {
      toast.error("Please enter OTP")
      return
    }
    try {
      setIsLoading(true)
      const res = await fetch("http://localhost:4000/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: otpEmail, otp }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed")
      }

      if (tempUserData) {
        setAuthUser(tempUserData)
        toast.success(`Welcome, ${tempUserData.fullname}!`)
      }
      setShowOtpInput(false)
      onClose()
      navigate("/")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("http://localhost:4000/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: otpEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP")
      toast.success("OTP resent successfully!")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Submit handlers
  const onLoginSubmit = (data) => handleUserLogin("http://localhost:4000/user/login", data, "User")
  const onAdminLoginSubmit = (data) => handleUserLogin("http://localhost:4000/admin/login", data, "Admin")
  const onSignupSubmit = (data) => handleSignup(data, false)
  const onAdminSignupSubmit = (data) => handleSignup(data, true)

  if (!isOpen) return null

  // OTP Modal
  if (showOtpInput) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Verify OTP</h2>
              <p className="text-gray-600 text-sm mt-1">Enter the code sent to {otpEmail}</p>
            </div>
            <button
              onClick={() => setShowOtpInput(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-lg font-mono"
                maxLength={6}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleOtpVerify}
                disabled={isLoading || !otp.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify OTP"
                )}
              </button>

              <button
                onClick={handleResendOtp}
                disabled={isLoading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Resend OTP"}
              </button>

              <button
                onClick={() => setShowOtpInput(false)}
                className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Auth Modal
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{type === "login" ? "Welcome Back" : "Create Account"}</h2>
            <p className="text-gray-600 mt-1">
              {type === "login" ? "Sign in to your account to continue" : "Join us and start your journey today"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {type === "login" ? (
            // LOGIN FORM
            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    placeholder="Enter your Email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("email", { required: "Email is required" })}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your Password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Signing In...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>

                <button
                  type="button"
                  onClick={googleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  <img
                    src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png"
                    alt="Google"
                    className="w-5 h-5 mr-2"
                  />
                  Login with Google
                </button>

                <button
                  type="button"
                  onClick={handleSubmit(onAdminLoginSubmit)}
                  disabled={isLoading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Admin Login
                </button>
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          ) : (
            // SIGNUP FORM
            <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-4">
              {/* Fullname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Enter your Full Name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.fullname ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("fullname", { required: "Full name is required" })}
                  />
                </div>
                {errors.fullname && <p className="text-red-500 text-xs mt-1">{errors.fullname.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    placeholder="Enter your Email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("email", { required: "Email is required" })}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your Password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Enter your Location"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.location ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("location", { required: "Location is required" })}
                  />
                </div>
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
              </div>

              {/* Profile Pic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (Optional)</label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        {...register("profilePic", {
                          validate: (fileList) => {
                            if (!fileList || fileList.length === 0) return true
                            const file = fileList[0]
                            const allowed = ["image/jpeg", "image/png", "image/jpg"]
                            return allowed.includes(file.type)
                              ? true
                              : "Invalid file type! Only .png, .jpg, and .jpeg files are accepted."
                          },
                        })}
                      />
                    </div>
                    {errors.profilePic && <p className="text-red-500 text-xs mt-1">{errors.profilePic.message}</p>}
                  </div>
                  {profilePreview && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                      <img
                        src={profilePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Account...
                    </div>
                  ) : (
                    "Sign Up"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSubmit(onAdminSignupSubmit)}
                  disabled={isLoading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Admin Signup
                </button>
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
