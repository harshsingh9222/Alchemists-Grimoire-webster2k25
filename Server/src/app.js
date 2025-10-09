import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/user.Routes.js';
import medicineRouter from './Routes/medicine.Router.js';
import dashboardRoutes from "./Routes/dashboad.Routes.js";
import doseScheduler from "./schedulers/doseSchedulers.js";
import wellnessRoutes from './Routes/wellness.Routes.js';
import doseRoutes from './Routes/dose.Route.js';
import charRoutes from './Routes/chatRoute.js';

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

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'API endpoints are available here',
    version: '1.0.0'
  });
});

// Auth routes
app.use('/auth', userRouter);
// Medicines routes
app.use('/medicines', medicineRouter);

// Dashboard routes
app.use('/dashboard', dashboardRoutes);

// Wellness routes
app.use('/wellness', wellnessRoutes);

// Dose routes
app.use('/doses', doseRoutes);
app.use("/chat", charRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

doseScheduler.init();  
export { app };
