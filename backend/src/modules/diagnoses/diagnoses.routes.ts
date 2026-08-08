import { Router } from "express";
import * as controller from "./diagnoses.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createDiagnosisSchema } from "./diagnoses.validation";

const router = Router();

router.use(authenticate);

router.post("/", validate(createDiagnosisSchema), controller.create);
router.get("/patient/:patientId", controller.listForPatient);

export default router;
