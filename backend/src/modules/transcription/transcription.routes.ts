import { Router } from "express";
import multer from "multer";
import * as controller from "./transcription.controller";
import { authenticate } from "../../middleware/auth";

// Memory storage: files are forwarded straight to the Python service,
// never written to disk on the Node side.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const router = Router();

router.use(authenticate);

// multipart/form-data fields: "audio" (optional file), "document" (optional file),
// plus optional text fields "language" and "ocrLang"
router.post(
  "/",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  controller.transcribe
);

export default router;
