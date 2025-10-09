import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { userSignup } from "../api"
import {useDispatch} from "react-redux"
import {login as authLogin} from "../store/authSlice"
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
      </form>
    </div>
  );
}

export default Signup
