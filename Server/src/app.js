import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json(
    {
        limit:'16kb'
    }
));

app.use(express.urlencoded({ extended: true, limit:'16kb' }));

app.use(cookieParser());


// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Alchemist\'s Grimoire API',
    status: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'API endpoints will be available here',
    version: '1.0.0'
  });
});

// Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     error: 'Something went wrong!',
//     message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//   });
// });

export {app};
