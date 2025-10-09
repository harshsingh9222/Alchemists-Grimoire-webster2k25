import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: false,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [function () {
      return this.provider === 'local';
    }, 'Password is required for local authentication'],
  },
  image: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  },
  // Google specific data (store refresh token for Calendar API use)
  google: {
    refreshToken: { type: String, default: null },
    id: { type: String, default: null }
  },
  // Has the user completed onboarding (profile, first-run setup)?
  onboarded: {
    type: Boolean,
    default: false,
    index: true
  },
  // i had added the character feild
  character: { 
    type: String, 
    enum: ["ringmaster", "acrobat", "magician", "juggler"], 
    default: null 
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPasswordCorrect= async function (password){
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { 
      _id: this._id, 
      username: this.username,
      email: this.email,
     },
    process.env.ACCESS_TOKEN_SECRET,
    { 
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY 
    }
  );
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  );
}

const User = mongoose.model('User', userSchema);

export default User;