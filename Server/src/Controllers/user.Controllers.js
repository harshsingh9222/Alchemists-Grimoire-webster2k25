import User from "../Models/user.models.js";
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { generateAccessAndRefreshToken } from "../Utils/tokens.js";
import Medicine from "../Models/medicineModel.js";

const options = {
    httpOnly: true,
    secure: true
}

const registerUser = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        const username = req.body.username.trim().toLowerCase();
        // Validate that required fields are present
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if user already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Create new user
        const user = await User.create({
            username: username.toLowerCase(),
            email,
            password,
            provider: 'local'
        });

        // Generate JWT token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        //remove password and refreshToken from user object before sending response
        const createdUser = await User.findById(user._id).select("-password -refreshToken");


        return res.status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                message: 'User registered successfully.',
                accessToken,
                refreshToken,
                user: createdUser
            });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// local login
const localLogin = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user || user.provider !== 'local') {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Compare password
        const isMatch = await user.isPasswordCorrect(password)

        if (!isMatch) {
            return new ApiError(400, 'Invalid Credentials Password Incorrect')
        }

        // Generate JWT tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        // Remove password and refreshToken from user object before sending response
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                message: 'Login successful.',
                accessToken,
                refreshToken,
                user: loggedInUser
            });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//logout
const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        { new: true }
    );

    console.log('User after logout:', user);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'Logout Successful'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRefToken = req.cookies?.refreshToken || req.body?.refreshToken || req.header("Authorization").replace("Bearer ", "")

    if (!inComingRefToken) {
        throw new ApiError(401, 'Unauthorized Access')
    }

    try {
        const decodedToken = jwt.verify(inComingRefToken, process.env.REFRESH_TOKEN_SECRET)

       const user = await User.findById(decodedToken?._id).select("+refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (user?.refreshToken != inComingRefToken) {
            throw new ApiError(401, 'Mismatch Refresh token')
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access Token refreshed successfully"
                )
            )

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }

})

const getCurrentUser = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    return res
        .status(200)
        .json({
            message: "Current user fetched successfully",
            user: req.user
        });
};

const addMedicine = async (req, res) => {
  try {
    const { userId, medicineName, dosage, frequency, times, startDate, endDate, notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newMedicine = new Medicine({
      userId,
      medicineName,
      dosage,
      frequency,
      times,
      startDate,
      endDate,
      notes,
    });

    await newMedicine.save();

    res.status(201).json({ message: "Medicine saved successfully", medicine: newMedicine });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export { addMedicine,registerUser, localLogin, getCurrentUser, logoutUser, refreshAccessToken };