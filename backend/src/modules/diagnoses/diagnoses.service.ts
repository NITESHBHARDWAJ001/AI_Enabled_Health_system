import { NotificationType, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";
import { createNotification } from "../notifications/notifications.service";
import { triggerInfectionAlert } from "./infectionAlerts.service";
import { logger } from "../../config/logger";

export async function createDiagnosis(
  requester: AuthUser,
  input: {
    consultationId: string;
    conditionName: string;
    description?: string;
    aiSuggested?: boolean;
    isContagious?: boolean;
    contagionCategory?: string;
  }
) {
  if (requester.role !== Role.DOCTOR) throw ApiError.forbidden("Only doctors can create a diagnosis");

  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    include: { diagnosis: true },
  });
  if (!consultation) throw ApiError.notFound("Consultation not found");
  if (consultation.doctorId !== requester.doctorId) throw ApiError.forbidden();
  if (consultation.diagnosis) throw ApiError.conflict("This consultation already has a diagnosis");

  const diagnosis = await prisma.diagnosis.create({
    data: {
      consultationId: consultation.id,
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      conditionName: input.conditionName,
      description: input.description,
      aiSuggested: input.aiSuggested ?? false,
      confirmedByDoctor: true,
      isContagious: input.isContagious ?? false,
      contagionCategory: input.isContagious ? input.contagionCategory : undefined,
    },
  });

  const patient = await prisma.patient.findUnique({
    where: { id: consultation.patientId },
    select: { userId: true },
  });
  if (patient) {
    await createNotification(
      patient.userId,
      NotificationType.DIAGNOSIS_CREATED,
      "New diagnosis recorded",
      `Your doctor recorded a new diagnosis: ${input.conditionName}.`,
      { diagnosisId: diagnosis.id }
    );
  }

  if (diagnosis.isContagious && diagnosis.contagionCategory) {
    triggerInfectionAlert(consultation.doctorId, consultation.patientId, diagnosis.contagionCategory).catch((err) =>
      logger.error({ err }, "Infection alert flow failed")
    );
  }

  return diagnosis;
}

export async function listDiagnosesForPatient(requester: AuthUser, patientId: string) {
  if (requester.role === Role.PATIENT && requester.patientId !== patientId) throw ApiError.forbidden();
  return prisma.diagnosis.findMany({
    where: { patientId },
    include: { doctor: { select: { id: true, fullName: true, specialty: true } } },
    orderBy: { createdAt: "desc" },
  });
}
