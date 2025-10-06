import axios from 'axios';

// Default to backend server on port 8000 (matches Server/src/index.js)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Debug: show resolved API base URL in dev
if (import.meta.env && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.debug('[axios.helper] API baseURL =', API_URL);
}

// Named export axiosInstance and default export for compatibility
export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Refresh token handling
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Use a plain axios instance for refresh calls to avoid interceptor recursion
const refreshClient = axios.create({ baseURL: API_URL, withCredentials: true });

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If no response or not 401, reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Queue the request until refresh completes
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          // After refresh, retry original request
          originalRequest.headers['Authorization'] = token ? `Bearer ${token}` : undefined;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      // Call refresh endpoint - backend should read refresh token from cookie and set new access token cookie
      const refreshResponse = await refreshClient.post('/auth/refresh');

      // Optionally extract new access token if backend returns it in body (not necessary if stored in cookie)
      const newToken = refreshResponse.data?.accessToken;

      isRefreshing = false;
      onRefreshed(newToken);

      // Retry original request
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      }
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      // Could redirect to login here
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
