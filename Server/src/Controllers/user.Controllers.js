import User from "../Models/user.models.js";
import jwt from 'jsonwebtoken'
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { generateAccessAndRefreshToken } from "../Utils/tokens.js";
import { initializeUserData } from "../Scripts/initializeUserData.js";
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import oauth2Client from "../Utils/googleConfig.js"
import axios from "axios"
import { createCalendarEventForUser } from '../Utils/googleCalendar.js'

const options = {
    httpOnly: true,
    secure: true
}

const secret = "jn4k5n6n5nnn6oi4n"

// OTP storage (in-memory for now - use Redis in production)
// Stored shape per email:
// { otp, expiresAt, attempts, sentAt, failures, lockUntil }
const otpStorage = new Map()

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create email transporter
const createEmailTransporter = () => {
  // If credentials are not set, create a test account (Ethereal) for local testing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER or EMAIL_PASS not set. Using Ethereal test account for local email testing.')
    // createTestAccount is async, but nodemailer provides a sync alternative via createTransport with direct transport
    // We'll create a test account synchronously via nodemailer.createTestAccount (returns promise)
    // To keep this function synchronous, we return a transporter created for Ethereal if available.
    // In the sendOTP flow we will fallback to creating the test account when needed.
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
}

const googleLogin = async (req, res) => {
  try {
    const { code } = req.query
    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" })
    }

    console.log("Google OAuth code received:", code)

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

  // Log which token fields were returned (do not log full token values in production)
  console.log("Tokens received from Google. Keys:", Object.keys(tokens || {}))
    // Log requested/granted scopes
    console.log('tokens.scope:', tokens?.scope)

    // Fetch user info from Google
    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
    )
    const { email, name, picture } = userRes.data

    console.log("Google user info:", { email, name })

    // Proceed with normal Google login: find/create user and issue tokens

    // Otherwise proceed with normal Google login: find/create user and issue tokens
    let user = await User.findOne({ email })
    if (!user) {
      console.log("Creating new user from Google OAuth")
       // Mark Google-created accounts as onboarded/confirmed since OAuth provides verified email
       user = await User.create({
         username: name,
         email,
         provider: 'google',
         profilePic: picture,
         onboarded: true,
         emailConfirmed: true
       })
    } else {
      console.log("Existing user found:", user.username)
      // If the existing user was created earlier without onboarding, ensure provider and onboarded are updated
      if (user.provider !== 'google' || !user.onboarded || !user.emailConfirmed) {
        user.provider = 'google'
        user.onboarded = true
        user.emailConfirmed = true
      }
    }

    // Ensure user provider and username are set
    if (!user.provider || user.provider !== 'google') {
      user.provider = 'google'
    }
    if (!user.username) {
      user.username = email.split('@')[0]
    }
    // If Google returned a refresh_token, persist it to the user record for later Calendar API calls
    if (tokens?.refresh_token) {
      user.google = user.google || {}
      user.google.refreshToken = tokens.refresh_token
      // also persist the googleId if available
      if (userRes.data?.id) user.google.id = userRes.data.id
    }
    // Persist any provider/onboarded updates
    await user.save()

    // Generate access and refresh tokens consistent with other flows
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    await initializeUserData(user._id);

    // Set cookies same as register/login flows
    const calendarScopeGranted = !!(tokens?.scope && tokens.scope.includes('https://www.googleapis.com/auth/calendar.events'))
    if (!calendarScopeGranted) console.warn('Google login: calendar scope NOT granted. To create calendar events, re-consent with calendar scope (prompt=consent).')

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "Login successful",
        calendarScopeGranted,
        user: {
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role || 'user',
          location: user.location,
          profilePic: user.profilePic,
        },
      })
  } catch (error) {
    // Improved error logging to surface Google / token exchange errors
    console.error("Error in Google login:", error?.response?.data || error?.message || error)

    // If this is an OAuth error from Google, include the details in the response
    const googleError = error?.response?.data || error?.response || error?.message || error
    return res.status(500).json({ message: "Internal server error", error: googleError })
  }
}



// Send OTP via email
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    // It's OK if the user does not exist yet. We allow sending OTP to any email
    // so the OTP flow can be used for passwordless signup/login.
    const user = await User.findOne({ email })
    if (!user) {
      console.log(`sendOTP: no existing user for ${email} - proceeding to send OTP`)
    }

    // Respect resend cooldown (30 seconds) and any existing lockouts
    const now = Date.now()
    const existing = otpStorage.get(email) || {}
    if (existing.lockUntil && now < existing.lockUntil) {
      const wait = Math.ceil((existing.lockUntil - now) / 1000)
      return res.status(429).json({ message: 'Too many failed attempts. Try again later.', waitTime: wait })
    }

    if (existing.sentAt && (now - existing.sentAt) < 30 * 1000) {
      const wait = Math.ceil((30 - (now - existing.sentAt) / 1000))
      return res.status(429).json({ message: 'Please wait before requesting a new OTP', waitTime: wait })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = now + 10 * 60 * 1000 // 10 minutes

    // Store OTP with expiration and preserve failure count
    otpStorage.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      sentAt: now,
      failures: existing.failures || 0,
      lockUntil: existing.lockUntil || null,
    })

    // Create email transporter; if no real credentials are configured, create an Ethereal test account
    let transporter = createEmailTransporter()
    let isEthereal = false
    let etherealAccount = null
    if (!transporter) {
      // Create a test account for local development
      etherealAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass,
        },
      })
      isEthereal = true
    }

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code - MyApp",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Your OTP Code</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #666; text-align: center; margin-top: 20px;">
            This OTP will expire in 10 minutes. Do not share this code with anyone.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    }

    // Send email and handle errors from the transporter
    try {
      const info = await transporter.sendMail(mailOptions)
      console.log(`OTP sent to ${email}: ${otp}. transporter response:`, info)

      const responsePayload = { message: 'OTP sent successfully', email }
      // If using Ethereal, include preview URL so developer can view the message in browser
      if (isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info)
        console.log('Ethereal preview URL:', previewUrl)
        responsePayload.previewUrl = previewUrl
      }

      res.status(200).json(responsePayload)
    } catch (mailErr) {
      console.error('Error sending mail via transporter:', mailErr)
      return res.status(500).json({ message: 'Failed to send OTP email', details: mailErr.message || mailErr })
    }
  } catch (error) {
    console.error("Error sending OTP:", error)
    res.status(500).json({ message: "Failed to send OTP" })
  }
}

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, createWithPassword, username: bodyUsername, password: bodyPassword } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" })
    }

    // Get stored OTP data
    const storedOTPData = otpStorage.get(email)

    if (!storedOTPData) {
      return res.status(400).json({ message: "OTP not found or expired" })
    }

    // Check if OTP is expired
    if (Date.now() > storedOTPData.expiresAt) {
      otpStorage.delete(email)
      return res.status(400).json({ message: "OTP has expired" })
    }

    // Check attempts (max 3 attempts)
    if (storedOTPData.attempts >= 3) {
      otpStorage.delete(email)
      return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." })
    }

    // Verify OTP
    if (storedOTPData.otp !== otp.toString()) {
      storedOTPData.attempts += 1
      // Increase failures only when a verification attempt fails (not resend)
      storedOTPData.failures = (storedOTPData.failures || 0) + 1

      // If failures exceed 3, apply exponential lockout
      if (storedOTPData.failures >= 3) {
        const exponent = storedOTPData.failures - 3 // 0 for first lock, increases
        const lockSeconds = Math.min(60 * Math.pow(2, exponent), 60 * 60 * 24) // cap 24h
        storedOTPData.lockUntil = Date.now() + lockSeconds * 1000
      }

      otpStorage.set(email, storedOTPData)

      return res.status(400).json({
        message: "Invalid OTP",
        attemptsLeft: Math.max(0, 3 - storedOTPData.attempts),
        lockedUntil: storedOTPData.lockUntil || null,
      })
    }

    // OTP is valid - remove from storage
    otpStorage.delete(email)

    // Get or create user data - allow OTP to act as passwordless signup
    let user = await User.findOne({ email })
    if (!user) {
      console.log(`verifyOTP: creating new user for ${email}`)
      const username = createWithPassword && bodyUsername ? bodyUsername : email.split('@')[0]
      // If caller asked to create with provided password, use it; otherwise generate a random one
      const passwordToUse = createWithPassword && bodyPassword ? bodyPassword : crypto.randomBytes(16).toString('hex')
      // Create a local user via OTP: mark emailConfirmed true so email verification is recorded
      user = await User.create({ username, email, password: passwordToUse, provider: 'local', onboarded: false, emailConfirmed: true })
    } else {
      // If user exists and caller requested createWithPassword, do not overwrite existing password.
      // Ensure existing users are marked emailConfirmed after successful OTP verification
      if (!user.emailConfirmed) {
        user.emailConfirmed = true
        await user.save()
      }
    }

    // Generate access and refresh tokens consistent with other auth flows
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    // Set cookies for authenticated session
    res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json({
        message: 'OTP verified successfully',
        user: {
          _id: user._id,
          fullname: user.username,
          email: user.email,
        },
      })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    res.status(500).json({ message: "Failed to verify OTP" })
  }
}

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    // Use the same sendOTP logic (sendOTP will enforce resend cooldown and lockouts)
    await sendOTP(req, res)
  } catch (error) {
    console.error("Error resending OTP:", error)
    res.status(500).json({ message: "Failed to resend OTP" })
  }
}

const registerUser = asyncHandler(async (req, res) => {
    try {
        console.log("Printing the request->",req);
        const { email, password } = req.body;
        console.log("Register Email->",email);
        console.log("Password->",password);
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
      provider: 'local',
      onboarded: false
    });

        // Generate JWT token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        //remove password and refreshToken from user object before sending response
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        await initializeUserData(user._id);

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
        console.log("Email from login:",email);
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

// this is for the current user
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


// Debug controller: try to create a minimal calendar event for the current user and return helper result
const testCreateGoogleEvent = async (req, res) => {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ message: 'Unauthorized' })

    const payload = {
      summary: 'Test event from server',
      description: 'Diagnostic event',
      start: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
      end: { dateTime: new Date(new Date().getTime() + 15 * 60000).toISOString(), timeZone: 'UTC' }
    }

    const result = await createCalendarEventForUser(user, payload)
    return res.status(200).json({ result })
  } catch (err) {
    console.error('testCreateGoogleEvent error:', err)
    return res.status(500).json({ message: 'Internal error', error: String(err) })
  }
}




export { testCreateGoogleEvent, getGoogleClientInfo, googleLogin, sendOTP, verifyOTP,resendOTP,registerUser, localLogin, getCurrentUser, logoutUser, refreshAccessToken };

// Debug: return Google OAuth client info (client id and redirect URI) to confirm server config
const getGoogleClientInfo = async (req, res) => {
  try {
    return res.status(200).json({
      clientId: process.env.GOOGLE_CLIENT_ID || null,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || null,
      project: process.env.GOOGLE_PROJECT || null
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read client info' })
  }
}

// Fetch events from the user's primary Google Calendar for a given month
const getCalendarEventsForMonth = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ message: 'year and month query params required (e.g. ?year=2025&month=10)' });

    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);

    // Use googleapis directly here with a fresh client like createCalendarEventForUser
    const { google } = await import('googleapis');
    const OAuth2 = google.auth.OAuth2;
    const client = new OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

    const refreshToken = user?.google?.refreshToken;
    if (!refreshToken) return res.status(400).json({ message: 'No Google refresh token for this user' });

    client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: client });

    const resp = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
    });

    return res.status(200).json({ events: resp.data.items || [] });
  } catch (err) {
    console.error('getCalendarEventsForMonth error:', err?.response?.data || err?.message || err);
    return res.status(500).json({ message: 'Failed to fetch calendar events', error: String(err) });
  }
}

export { getCalendarEventsForMonth };

// PUT /api/auth/character


export const updateCharacter = async (req, res) => {
  try {
    const { characterId } = req.body;
    const userId = req.user.id; // assuming you use JWT middleware

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.onboarded) {
      return res
        .status(400)
        .json({ error: "Character cannot be changed after onboarding" });
    }

    // First-time character selection
    user.character = characterId;
    user.onboarded = true;

    await user.save();

    res.json({
      message: "Character selected successfully",
      character: user.character,
      onboarded: user.onboarded,
    });
  } catch (error) {
    console.error("Error updating character:", error);
    res.status(500).json({ error: "Failed to update character" });
  }
};



