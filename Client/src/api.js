import { axiosInstance } from './Utils/axios.helper';

// Small helper to decide headers and format body for axios
const request = async (endpoint, method = 'GET', data = null, isFormData = false) => {
  try {
    const config = {
      url: endpoint,
      method,
      withCredentials: true
    };

    if (data) {
      if (isFormData) {
        config.data = data;
        // Let browser set correct multipart boundary
        config.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        config.data = data;
      }
    }

    const res = await axiosInstance.request(config);
    return res.data;
  } catch (err) {
    // Normalize axios error
    const message = err.response?.data?.message || err.message || 'API Error';
    console.error(`API Error [${method} ${endpoint}]:`, message);
    throw err;
  }
};

export const userSignup = async (formData) => request('/auth/register', 'POST', formData, false);
export const userLogin = async (formData) => request('/auth/login', 'POST', formData, false);
export const addMedicines = async (formData) => request('/medicines/addMedicines', 'POST', formData, false);
export const fetchMedicines = async () => request('/medicines/fetchMedicines', 'GET');
export const googleAuth = async (code, requireOtp = false) => request(`/auth/google?code=${encodeURIComponent(code)}${requireOtp ? '&requireOtp=true' : ''}`, 'GET');
export const adminLogin = async (credentials) => request('/auth/admin/login', 'POST', credentials);
export const userLogout = async () => request('/auth/logout', 'POST');
export const adminSignup = async (formData) => request('/auth/admin/signup', 'POST', formData, true);
export const sendOTP = async (email) => request('/auth/send-otp', 'POST', { email });
export const verifyOTP = async (email, otp) => request('/auth/verify-otp', 'POST', { email, otp });
export const uploadFile = async (formData) => request('/upload', 'POST', formData, true);
export const getUserProfile = async () => request('/user/profile', 'GET');
