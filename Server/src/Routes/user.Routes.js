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
  testCreateGoogleEvent,
  getGoogleClientInfo,
  updateCharacter,
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
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route("/character").put(verifyJWT, updateCharacter);


// Current user
router.route('/current-user').get(verifyJWT, getCurrentUser);

// Debug route to test calendar event creation
router.post('/test-google-event', verifyJWT, testCreateGoogleEvent);

// Expose Google client info (non-sensitive): client id and redirect uri used by server
router.get('/google-client-info', getGoogleClientInfo);

export default router;
