// React import not required with new JSX runtime
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { userLogin } from "../api";
import { login as authLogin } from "../store/authSlice.js";
import { useDispatch } from "react-redux";
import { googleAuth, verifyOTP as apiVerifyOTP } from "../api.js";
import { useGoogleLogin } from "@react-oauth/google";
import { useEffect, useCallback } from "react";
import CircusDecor from "../Components/CircusDecor";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await userLogin(formData);

      console.log("User logged in:", res);
      dispatch(authLogin(res.user));

      navigate("/"); // redirect to homepage after login
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
    setLoading(false);
  };

  const responseGoogle = useCallback(
    async (authResult) => {
      try {
        if (authResult.code) {
          // Instead of completing login on the server, request OTP be sent to the Google email
          const sendOtpResp = await googleAuth(authResult.code, true);
          toast.success(
            "OTP sent to your Google email (check preview URL in response if using Ethereal)"
          );

          // If server returned an Ethereal preview URL (local dev), show it to the user
          if (sendOtpResp.previewUrl) {
            // Show preview link so the developer/tester can open it
            // In production you would not show this
            // eslint-disable-next-line no-alert
            alert(`Preview URL for OTP email:\n${sendOtpResp.previewUrl}`);
          }

          // Prompt user to enter OTP (simple flow). You can replace with a modal form.
          // eslint-disable-next-line no-alert
          const userOtp = window.prompt("Enter the OTP sent to your email:");
          if (!userOtp) {
            toast.error("OTP entry cancelled");
            return;
          }

          // Verify OTP with backend
          const verifyResp = await apiVerifyOTP(sendOtpResp.email, userOtp);

          // On success, server sets cookies; update client state
          dispatch(authLogin(verifyResp.user));
          localStorage.setItem("User", JSON.stringify(verifyResp.user));
          toast.success(
            `Welcome, ${verifyResp.user.fullname || verifyResp.user.email}!`
          );

          if (window.opener) {
            window.opener.postMessage("googleLoginSuccess", "*");
            window.close();
          } else {
            modal?.close();
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Google auth failed:", error);
        toast.error("Google authentication failed!");
      }
    },
    [navigate, modal, dispatch]
  );

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
    ux_mode: "popup",
  });

  return (
    <CircusDecor>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-yellow-400 text-white py-2 rounded hover:from-purple-500 hover:to-yellow-300 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              onClick={googleLogin}
              className="btn btn-outline w-80"
            >
              <img
                src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-1024.png"
                alt="Google"
                className="w-5 h-5 inline-block mr-2"
              />
              Login with Google
            </button>
          </form>
        </div>
      </div>
    </CircusDecor>
  );
};

export default Login;
