import { Router } from "express";
import * as controller from "./consultations.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createConsultationSchema, updateConsultationSchema } from "./consultations.validation";

const router = Router();

router.use(authenticate);

router.post("/", validate(createConsultationSchema), controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updateConsultationSchema), controller.update);

export default router;
