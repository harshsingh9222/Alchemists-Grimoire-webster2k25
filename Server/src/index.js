// Load environment variables
import 'dotenv/config';
import { app } from "./app.js";
import { connectDB } from "./DB/connectDB.js";
import userRouter from './Routes/user.Routes.js';
import medicineRouter from "./Routes/medicine.Router.js";

console.log("Loaded MONGODB_URI =", process.env.MONGODB_URI);

const PORT = process.env.PORT || 8000;

// Routes
app.get('/', (req, res) => {
  res.send('Hello, World');
});
app.use('/auth', userRouter);
app.use('/medicines', medicineRouter);

// Start server function
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log("✅ Server is running on port", PORT);
      console.log("Environment:", process.env.NODE_ENV);
      console.log("🌐 API available at:", `http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("❌ Error starting server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();
