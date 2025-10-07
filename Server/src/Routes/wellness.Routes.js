import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import {
  updateWellnessMetrics,
  getWellnessHistory,
  getTodayWellness
} from "../Controllers/wellness.Controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Wellness routes
router.post("/update", updateWellnessMetrics);
router.get("/history", getWellnessHistory);
router.get("/today", getTodayWellness);

export default router;