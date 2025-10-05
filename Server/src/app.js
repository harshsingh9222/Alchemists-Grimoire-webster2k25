import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/user.Routes.js';
import medicineRouter from './Routes/medicine.Router.js';

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({
  limit: '16kb'
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '16kb' 
}));

app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Alchemist\'s Grimoire API',
    status: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});


// Auth routes
app.use('/auth', userRouter);

// Medicine routes
app.use('/medicines', medicineRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

export { app };

