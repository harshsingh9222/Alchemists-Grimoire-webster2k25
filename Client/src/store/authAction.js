import { logout } from './authSlice';
import { userLogout } from '../api';

// performLogout: call backend logout via api.js, then always clear client-side auth state
export const performLogout = () => async (dispatch) => {
  let ok = false
  try {
    await userLogout()
    ok = true
    console.log('Logout request succeeded (api.js)')
  } catch (err) {
    console.error('Error calling userLogout:', err?.message || err)
    // continue with client cleanup even if backend call fails
  } finally {
    // no axios instance in this project to clear — use api.js for requests

    // clear persisted user
    try {
      localStorage.removeItem('User')
    } catch (e) {
      // ignore
    }

    // update redux state
    dispatch(logout())
  }

  return ok
}
