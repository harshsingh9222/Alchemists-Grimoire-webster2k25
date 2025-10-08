import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import {
  getDosesByDate,
  updateDoseStatus,
  getDoseHistory,
} from "../Controllers/dose.Controller.js";

import {
  getDailyDoseSummary, 
} from "../Controllers/doseLogController.js";

const router = Router();


router.use(verifyJWT);


router.get("/by-date", getDosesByDate);
router.get("/history", getDoseHistory);
router.post("/update", updateDoseStatus);
router.post("/skip", updateDoseStatus); 

// ===================== Dose Log Summary ===================== //

router.get("/summary", getDailyDoseSummary);

export default router;
