import { Router } from "express";
import * as controller from "./hospitals.controller";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { ApiError } from "../../utils/ApiError";
import { Role } from "@prisma/client";
import {
  createHospitalSchema,
  updateHospitalSchema,
  createDepartmentSchema,
} from "./hospitals.validation";

const router = Router();

router.use(authenticate);

function ownHospitalOnly(req: any, _res: any, next: any) {
  if (req.user.role === Role.HOSPITAL_ADMIN && req.user.hospitalId !== req.params.id) {
    return next(ApiError.forbidden("You can only manage your own hospital"));
  }
  next();
}

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", requireRole(Role.SUPER_ADMIN), validate(createHospitalSchema), controller.create);
router.patch(
  "/:id",
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN),
  ownHospitalOnly,
  validate(updateHospitalSchema),
  controller.update
);
router.post(
  "/:id/departments",
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN),
  ownHospitalOnly,
  validate(createDepartmentSchema),
  controller.addDepartment
);
router.get(
  "/:id/infection-alerts",
  requireRole(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN),
  ownHospitalOnly,
  controller.listInfectionAlerts
);

export default router;
