import express from 'express';
import { addMedicine, deleteMedicine, fetchMedicines, updateMedicine } from "../Controllers/medicine.Controller.js"

import { verifyJWT } from '../Middlewares/auth.middleware.js';

const router = express.Router();


router.route("/addMedicines").post(verifyJWT,addMedicine);
router.route("/fetchMedicines").get(verifyJWT,fetchMedicines);
router.route("/deleteMedicine/:id").delete(verifyJWT,deleteMedicine);
router.route("/updateMedicine/:id").put(verifyJWT,updateMedicine);




export default router;
