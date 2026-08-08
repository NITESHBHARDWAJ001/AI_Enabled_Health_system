import { Router } from "express";
import * as controller from "./doctors.controller";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { Role } from "@prisma/client";
import { createDoctorSchema, updateDoctorSchema } from "./doctors.validation";
import { setAvailabilitySchema, availableSlotsSchema } from "./availability.validation";

const router = Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post(
  "/",
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN),
  validate(createDoctorSchema),
  controller.create
);
router.patch(
  "/:id",
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DOCTOR),
  validate(updateDoctorSchema),
  controller.update
);

router.get("/:id/availability", controller.getAvailability);
router.put(
  "/:id/availability",
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DOCTOR),
  validate(setAvailabilitySchema),
  controller.setAvailability
);
router.get("/:id/available-slots", validate(availableSlotsSchema), controller.getAvailableSlots);

export default router;
