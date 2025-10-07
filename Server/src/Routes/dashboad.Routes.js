// ========================================
// server/routes/dashboardRoutes.js
// ========================================
import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import {
  getAdherenceData,
  getWellnessScore,
  getUpcomingDoses,
  getDashboardInsights,
  getStatistics,
  getPotionEffectiveness,
  recordDose
} from "../Controllers/dashboard.Controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Dashboard routes
router.get("/adherence", getAdherenceData);
router.get("/wellness", getWellnessScore);
router.get("/upcoming-doses", getUpcomingDoses);
router.get("/insights", getDashboardInsights);
router.get("/statistics", getStatistics);
router.get("/potion-effectiveness", getPotionEffectiveness);

// Action routes
router.post("/record-dose", recordDose);

export default router;