import { Router } from "express";
import * as controller from "./ai.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { startConversationSchema, sendMessageSchema, symptomAnalysisSchema, saveScreeningSchema } from "./ai.validation";

const router = Router();

router.use(authenticate);

router.post("/chat/conversations", validate(startConversationSchema), controller.startConversation);
router.get("/chat/conversations/patient/:patientId", controller.listConversations);
router.get("/chat/conversations/:id", controller.getConversation);
router.post("/chat/conversations/:id/messages", validate(sendMessageSchema), controller.sendMessage);

router.post("/symptom-analysis", validate(symptomAnalysisSchema), controller.symptomAnalysis);
router.post("/screening", validate(saveScreeningSchema), controller.saveScreeningRisk);

export default router;
