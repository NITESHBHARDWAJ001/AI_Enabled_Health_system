import { Router } from "express";
import * as controller from "./notifications.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", controller.list);
router.patch("/:id/read", controller.markRead);
router.patch("/read-all", controller.markAllRead);

export default router;
