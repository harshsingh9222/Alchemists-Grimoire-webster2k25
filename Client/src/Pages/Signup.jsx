import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { userSignup, googleAuth, verifyOTP as apiVerifyOTP } from "../api"
import {useDispatch} from "react-redux"
import {login as authLogin} from "../store/authSlice"
import toastHot from "react-hot-toast"
import { useGoogleLogin } from "@react-oauth/google"
// ...existing code...

const Signup = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  })

  // handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      
      const response = await userSignup(formData)

      console.log("Signup ->",response);
    //   console.log("Signup success data:", response.data)
        // Automatically log in the user
      dispatch(authLogin(response.user));

      toast.success("Registration successful!")
      navigate("/circus") // redirect to circus page
    } catch (error) {
      console.error("Signup error:", error.message)
      toast.error(error.message || "Signup failed")
    }
  }

  const [showPassword, setShowPassword] = useState(false);

  // Google login modal handling (copied from Login.jsx)
  const modal = document.getElementById("my_modal_3");

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === "googleLoginSuccess") {
        modal?.close();
        navigate("/");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      modal?.close();
    };
  }, [navigate, modal]);

  const responseGoogle = useCallback(
    async (authResult) => {
      try {
        if (authResult?.code) {
          console.debug('Google auth result (code):', authResult.code)
          const sendOtpResp = await googleAuth(authResult.code, true);
          console.debug('googleAuth sendOtpResp:', sendOtpResp)
          toastHot.success(
            "OTP sent to your Google email (check preview URL in response if using Ethereal)"
          );

          if (sendOtpResp?.previewUrl) {
            // eslint-disable-next-line no-alert
            alert(`Preview URL for OTP email:\n${sendOtpResp.previewUrl}`);
          }

          // eslint-disable-next-line no-alert
          const userOtp = window.prompt("Enter the OTP sent to your email:");
          if (!userOtp) {
            toastHot.error("OTP entry cancelled");
            return;
          }

          const verifyResp = await apiVerifyOTP(sendOtpResp.email, userOtp);
          console.debug('verifyOTP response:', verifyResp)

          // Defensive: ensure we have a user object
          const userObj = verifyResp?.user || verifyResp?.data?.user;
          if (!userObj) {
            console.error('No user returned from verifyOTP:', verifyResp)
            toastHot.error('Failed to verify OTP (no user data)')
            return
          }

          // Update redux store & localStorage
          dispatch(authLogin(userObj));
          localStorage.setItem("User", JSON.stringify(userObj));
          toastHot.success(
            `Welcome, ${userObj.fullname || userObj.email || userObj.username || ''}!`
          );

          // Attempt to notify opener (if flow opened in a separate window)
          try {
            if (window.opener) {
              window.opener.postMessage("googleLoginSuccess", "*");
              window.close();
            }
          } catch (err) {
            console.warn('Failed to postMessage to opener:', err)
          }

          // Close modal if present and always navigate to home
          modal?.close();
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("Google auth failed:", error);
        toastHot.error("Google authentication failed!");
      }
    },
    [navigate, modal, dispatch]
  );

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
    ux_mode: "popup",
    scope: 'openid profile email https://www.googleapis.com/auth/calendar.events',
    authorizationParams: {
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true'
    }
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-800">
      <form
        onSubmit={handleSubmit}
        className="bg-purple-800 bg-opacity-80 p-8 rounded-2xl shadow-2xl w-full max-w-md text-white border border-fuchsia-500"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center text-fuchsia-300 tracking-widest">
          🎪 Join the Circus
        </h2>

        {/* Full Name */}
        <input
          type="text"
          name="username"
          placeholder="Full Name"
          value={formData.username}
          onChange={handleChange}
          className="w-full mb-4 bg-purple-700 border border-fuchsia-400 rounded-lg px-4 py-3 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          required
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          className="w-full mb-4 bg-purple-700 border border-fuchsia-400 rounded-lg px-4 py-3 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          required
        />

        {/* Password with Eye Toggle */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Create your secret key"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-purple-700 border border-fuchsia-400 rounded-lg px-4 py-3 pr-10 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-fuchsia-300 hover:text-fuchsia-100 transition"
          >
            {showPassword ? (
              // 👁️ Eye Open
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12s-3.75 7.5-10.5 7.5S1.5 12 1.5 12z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
                />
              </svg>
            ) : (
              // 🙈 Eye Closed
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.45 10.45 0 001.5 12s3.75 7.5 10.5 7.5c1.963 0 3.747-.54 5.27-1.462M9.53 9.53a3.75 3.75 0 015.28 5.28m-5.28-5.28L4.5 4.5m10.31 10.31L19.5 19.5"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Submit Button with Glow */}
        <button
          type="submit"
          className="relative w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 py-3 rounded-lg font-bold text-lg shadow-lg overflow-hidden transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_5px_rgba(236,72,153,0.7)]"
        >
          ✨ Sign Up
          <span className="absolute inset-0 bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 opacity-0 hover:opacity-20 transition duration-500 blur-xl"></span>
        </button>

        <div className="relative flex items-center justify-center my-4">
          <span className="absolute bg-purple-800 px-3 text-fuchsia-200 text-sm">or</span>
          <div className="w-full border-t border-fuchsia-400"></div>
        </div>

        <button
          type="button"
          onClick={googleLogin}
          className="flex items-center justify-center w-full bg-white text-purple-800 py-3 rounded-lg font-semibold shadow-lg hover:scale-105 transform transition"
        >
          <img
            src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png"
            alt="Google"
            className="w-5 h-5 mr-2"
          />
          Sign up with Google
        </button>
      </form>
    </div>
  );
}

export default Signup
