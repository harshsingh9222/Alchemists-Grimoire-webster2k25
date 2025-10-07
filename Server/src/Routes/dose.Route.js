import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import {
  getDosesByDate,
  updateDoseStatus,
  getDoseHistory
} from "../Controllers/dose.Controller.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Dose routes
router.get("/by-date", getDosesByDate);
router.get("/history", getDoseHistory);
router.post("/update", updateDoseStatus);
router.post("/skip", updateDoseStatus); // Same handler, status comes from body

export default router;