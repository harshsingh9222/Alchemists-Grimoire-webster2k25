import jwt,{decode} from 'jsonwebtoken';
import User from "../Models/user.models.js";
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { asyncHandler } from '../Utils/asyncHandler.js';


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        console.log("No token found");
        return res.status(401).json({
            success: false,
            message: "Authentication token missing"
        });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        console.log("User in auth middleware:", user);

        if (!user) {
            throw new ApiError(401, " User not found or Invalid Access Token");
        }

        req.user = user;
    // convenience: attach userId directly for handlers that expect it
    req.userId = user?._id;
        next();
    } catch (error) {
        console.error("Error while verifying token:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired"
            });
        }

        return res.status(402).json({
            success: false,
            message: "Invalid Access token"
        });
    }
});
