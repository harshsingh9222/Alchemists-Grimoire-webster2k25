
import User from "../Models/user.models.js";
import { ApiError } from "./ApiError.js";

export const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        // Generate access token
        const accessToken = user.generateAccessToken();
        // Generate refresh token
        const refreshToken = user.generateRefreshToken();
        // Save refresh token in user document
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        console.error('Error generating tokens:', error);
        throw new ApiError(500, 'Internal Server Error');
    }
};