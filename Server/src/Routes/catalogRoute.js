import express from "express";
import { getCatalogByCharacter, suggestMedicineAI } from "../Controllers/catalogController.js";
import { verifyJWT } from '../Middlewares/auth.middleware.js';

const router = express.Router();

// 🤖 Suggest medicine based on feeling
router.route("/suggest").post(verifyJWT,suggestMedicineAI);
router.route("/get-catalog").get(verifyJWT,getCatalogByCharacter);


export default router;
