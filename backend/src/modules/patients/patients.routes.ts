import { Router } from "express";
import * as controller from "./patients.controller";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { Role } from "@prisma/client";
import {
  updatePatientSchema,
  createVitalSchema,
  createConditionSchema,
  updateLocationSchema,
} from "./patients.validation";
import { audit } from "../../middleware/audit";

const router = Router();

router.use(authenticate);

router.get("/", requireRole(Role.DOCTOR, Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN), controller.list);
router.get("/:id", audit("VIEW_PATIENT_RECORD", "patient"), controller.getById);
router.patch("/:id", validate(updatePatientSchema), controller.update);
router.patch("/:id/location", validate(updateLocationSchema), controller.updateLocation);

router.get("/:id/vitals", controller.listVitals);
router.post("/:id/vitals", validate(createVitalSchema), controller.addVital);

router.get("/:id/conditions", controller.listConditions);
router.post("/:id/conditions", validate(createConditionSchema), controller.addCondition);

export default router;
