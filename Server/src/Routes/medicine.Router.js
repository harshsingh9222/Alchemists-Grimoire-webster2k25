import express from 'express';
import { addMedicine, fetchMedicines } from "../Controllers/medicine.Controller.js"

import { verifyJWT } from '../Middlewares/auth.middleware.js';

const router = express.Router();


router.route("/addMedicines").post(verifyJWT,addMedicine);
router.route("/fetchMedicines").get(verifyJWT,fetchMedicines);





export default router;
