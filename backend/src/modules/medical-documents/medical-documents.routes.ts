import { Router } from "express";
import multer from "multer";
import * as controller from "./medical-documents.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { uploadDocumentSchema } from "./medical-documents.validation";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const router = Router();

router.use(authenticate);

router.post("/", upload.single("file"), validate(uploadDocumentSchema), controller.upload);
router.get("/patient/:patientId", controller.list);

export default router;
