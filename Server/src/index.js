// Load environment variables as early as possible
import 'dotenv/config';

import { app } from "./app.js";
import { connectDB } from "./DB/connectDB.js";

const PORT = process.env.PORT || 8000;

// Start server
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