// API Configuration
const API_BASE_URL = "http://localhost:4000"

// ✅ Helper function to make requests with proper error handling
const fetchAPI = async (endpoint, method = "GET", data = null, isFormData = false) => {
  try {
    const options = {
      method,
      credentials: "include", // ✅ Allows sending and receiving cookies
    }

    // Set headers only if not FormData (FormData sets its own boundary)
    if (!isFormData) {
      options.headers = {
        "Content-Type": "application/json",
      }
    }

    if (data) {
      if (isFormData) {
        options.body = data // FormData object
      } else {
        options.body = JSON.stringify(data)
      }
    }

    console.log(`Making ${method} request to: ${API_BASE_URL}${endpoint}`)

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error)
    throw error
  }
}

// ✅ Google Authentication API Call
export const googleAuth = async (code) => {
  return fetchAPI(`/user/google?code=${code}`, "GET")
}

// ✅ User Login
export const userLogin = async (credentials) => {
  return fetchAPI("/user/login", "POST", credentials)
}

// ✅ Admin Login
export const adminLogin = async (credentials) => {
  return fetchAPI("/user/admin/login", "POST", credentials)
}

// ✅ User Logout
export const userLogout = async () => {
  return fetchAPI("/user/logout", "POST")
}

// ✅ User Signup
export const userSignup = async (formData) => {
  return fetchAPI("/user/signup", "POST", formData, true)
}

// ✅ Admin Signup
export const adminSignup = async (formData) => {
  return fetchAPI("/admin/signup", "POST", formData, true)
}

// ✅ Send OTP
export const sendOTP = async (email) => {
  return fetchAPI("/user/send-otp", "POST", { email })
}

// ✅ Verify OTP
export const verifyOTP = async (email, otp) => {
  return fetchAPI("/user/verify-otp", "POST", { email, otp })
}

// ✅ Upload File (if needed)
export const uploadFile = async (formData) => {
  return fetchAPI("/upload", "POST", formData, true)
}

// ✅ Get User Profile
export const getUserProfile = async () => {
  return fetchAPI("/user/profile", "GET")
}
