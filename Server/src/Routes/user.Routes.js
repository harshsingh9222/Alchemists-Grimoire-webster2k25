import express from 'express';
import {
  registerUser,
  localLogin,
  getCurrentUser,
  logoutUser,
  refreshAccessToken,
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


// Current user
router.route('/current-user').get(verifyJWT, getCurrentUser);

export default router;
