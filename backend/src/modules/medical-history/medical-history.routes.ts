import { Router } from "express";
import * as controller from "./medical-history.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/:patientId/timeline", controller.timeline);
router.get("/:patientId/summary", controller.summary);

export default router;
