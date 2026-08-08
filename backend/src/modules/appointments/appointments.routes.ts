import { Router } from "express";
import * as controller from "./appointments.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createAppointmentSchema, updateAppointmentStatusSchema } from "./appointments.validation";

const router = Router();

router.use(authenticate);

router.post("/", validate(createAppointmentSchema), controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.patch("/:id/status", validate(updateAppointmentStatusSchema), controller.updateStatus);

export default router;
