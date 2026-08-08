import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import patientRoutes from "../modules/patients/patients.routes";
import doctorRoutes from "../modules/doctors/doctors.routes";
import hospitalRoutes from "../modules/hospitals/hospitals.routes";
import appointmentRoutes from "../modules/appointments/appointments.routes";
import consultationRoutes from "../modules/consultations/consultations.routes";
import diagnosisRoutes from "../modules/diagnoses/diagnoses.routes";
import prescriptionRoutes from "../modules/prescriptions/prescriptions.routes";
import medicalHistoryRoutes from "../modules/medical-history/medical-history.routes";
import medicalDocumentRoutes from "../modules/medical-documents/medical-documents.routes";
import aiRoutes from "../modules/ai/ai.routes";
import notificationRoutes from "../modules/notifications/notifications.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, status: "ok", timestamp: new Date().toISOString() }));

router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/consultations", consultationRoutes);
router.use("/diagnoses", diagnosisRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/medical-history", medicalHistoryRoutes);
router.use("/documents", medicalDocumentRoutes);
router.use("/ai", aiRoutes);
router.use("/notifications", notificationRoutes);

export default router;
