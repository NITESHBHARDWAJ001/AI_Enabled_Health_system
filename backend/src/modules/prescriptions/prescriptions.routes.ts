import { Router } from "express";
import * as controller from "./prescriptions.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createPrescriptionSchema } from "./prescriptions.validation";

const router = Router();

router.use(authenticate);

router.post("/", validate(createPrescriptionSchema), controller.create);
router.get("/patient/:patientId", controller.listForPatient);

export default router;
