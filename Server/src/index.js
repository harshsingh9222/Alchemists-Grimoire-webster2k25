import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
// console.log("Loaded MONGODB_URI =", process.env.MONGODB_URI);


import { app } from "./app.js";
import { connectDB } from "./DB/connectDB.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("✅ Server is running on port", PORT);
      console.log("Environment:", process.env.NODE_ENV);
    });
  })
  .catch((error) => {
    console.log("❌ Error connecting to the database", error);
    process.exit(1);
  });
