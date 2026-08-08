import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { registerPatientSchema, loginSchema, refreshSchema } from "./auth.validation";

const router = Router();

router.post("/register", validate(registerPatientSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", validate(refreshSchema), controller.logout);
router.get("/me", authenticate, controller.me);

export default router;
