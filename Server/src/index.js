// Load environment variables as early as possible so other modules (which may read
// env vars at import time) see them.
import 'dotenv/config';
// import cors from 'cors';
import { app } from "./app.js";
import { connectDB } from "./DB/connectDB.js";
import userRouter from './Routes/user.Routes.js'

console.log("Loaded MONGODB_URI =", process.env.MONGODB_URI);





const PORT = process.env.PORT || 5000;


// Routes
app.get('/',(req,res)=>{
  res.send('Hello, World');
});

app.use('/auth',userRouter);

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

  