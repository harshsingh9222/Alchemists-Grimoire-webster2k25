import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { userLogin } from "../api";
import { login as authLogin } from "../store/authSlice.js";
import { useDispatch } from "react-redux";
// ...existing code...

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
  const [showPassword, setShowPassword] = useState(false);


  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-800">
      <div className="bg-purple-800 bg-opacity-80 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center text-white border border-fuchsia-500">
        <h2 className="text-3xl font-extrabold mb-6 text-fuchsia-300 tracking-widest">
          🎪 Welcome to the Circus
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-purple-700 border border-fuchsia-400 rounded-lg px-4 py-3 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your secret key"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-purple-700 border border-fuchsia-400 rounded-lg px-4 py-3 pr-10 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
            />

            {/* Eye button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-fuchsia-300 hover:text-fuchsia-100"
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

          <button
            type="submit"
            disabled={loading}
            className="
    relative
    w-full
    bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500
    py-3 rounded-lg font-bold text-lg
    shadow-lg
    overflow-hidden
    transition duration-300
    hover:scale-105
    hover:shadow-[0_0_25px_5px_rgba(236,72,153,0.7)]
  "
          >
            {loading ? "🔮 Entering..." : "✨ Login"}

            {/* Glow effect layer */}
            <span
              className="
    absolute inset-0
    bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400
    opacity-0
    hover:opacity-20
    transition duration-500
    blur-xl
  "
            ></span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <span className="absolute bg-purple-800 px-3 text-fuchsia-200 text-sm">
              or
            </span>
            <div className="w-full border-t border-fuchsia-400"></div>
          </div>
        </form>
      </div>
    </div>
  );

};

export default Login;
