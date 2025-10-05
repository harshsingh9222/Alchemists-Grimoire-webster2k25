// React import not required with new JSX runtime
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { userSignup } from "../api"
import {useDispatch} from "react-redux"
import {login as authLogin} from "../store/authSlice"
import CircusDecor from "../Components/CircusDecor";

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
      navigate("/") // redirect to home page
    } catch (error) {
      console.error("Signup error:", error.message)
      toast.error(error.message || "Signup failed")
    }
  }

  return (
    <CircusDecor>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md w-96"
        >
          <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

          <input
            type="text"
            name="username"
            placeholder="Full Name"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 mb-3 border rounded"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 mb-3 border rounded"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 mb-3 border rounded"
            required
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-400 to-red-600 text-white py-2 rounded hover:from-yellow-300 hover:to-red-700"
          >
            Sign Up
          </button>
        </form>
      </div>
    </CircusDecor>
  )
}

export default Signup
