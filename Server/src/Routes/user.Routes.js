import express from 'express';
import {
  registerUser,
  localLogin,
  getCurrentUser,
  logoutUser,
  refreshAccessToken,
  googleLogin,
  verifyOTP,
  resendOTP,
  sendOTP,
} from '../Controllers/user.Controllers.js';
import { upload } from '../Middlewares/multer.middleware.js';
import {upload_cloud} from "../Middlewares/cloudinary_multer.middleware.js"
import { verifyJWT } from '../Middlewares/auth.middleware.js';


const router = express.Router();

// Simple test route
router.route('/test').get((req, res) => {
  res.send('Hello from userRouter!');
});


// Registration and login
router.route('/register').post(registerUser);
router.route('/login').post(localLogin);

// Logout
router.route('/logout').post(verifyJWT,logoutUser)

//RefreshAccessToken
router.route('/refreshaccesstoken').post(verifyJWT,refreshAccessToken)

// Google OAuth route
router.get("/google", googleLogin)

// Add these new routes after the existing ones:
router.post("/send-otp", sendOTP)
router.post("/verify-otp", verifyOTP)
router.post("/resend-otp", resendOTP)




// Current user
router.route('/current-user').get(verifyJWT, getCurrentUser);

export default router;
