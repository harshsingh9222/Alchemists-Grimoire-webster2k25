import axiosInstance from '../utils/axios.helper';
import { logout } from './authSlice';

export const performLogout = () => async (dispatch) => {
  try {
    // i have to make this by api.js
    const res = await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
    if (res.status === 200) {
      console.log('Logout successful:', res.data);

          window.location.reload();
    } else {
      console.error('Logout failed:', res.data);
    }

  } catch (err) {

    console.error('Error during logout:', err.response?.data || err.message);
    // console.log('err :>> ', err);
    if (err.response && err.response.status === 401) {
      console.error('Unauthorized access, user might already be logged out.');
    } else {
      console.error('Logout error:', err);
    }
  } finally {
    
    delete axiosInstance.defaults.headers.common['Authorization'];
    dispatch(logout());
  }
};
