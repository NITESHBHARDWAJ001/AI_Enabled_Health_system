import { NotificationType, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";
import { createNotification } from "../notifications/notifications.service";

interface PrescriptionItemInput {
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export async function createPrescription(
  requester: AuthUser,
  input: { consultationId: string; notes?: string; items: PrescriptionItemInput[] }
) {
  if (requester.role !== Role.DOCTOR) throw ApiError.forbidden("Only doctors can write a prescription");

  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    include: { prescription: true },
  });
  if (!consultation) throw ApiError.notFound("Consultation not found");
  if (consultation.doctorId !== requester.doctorId) throw ApiError.forbidden();
  if (consultation.prescription) throw ApiError.conflict("This consultation already has a prescription");

  const [prescription, doctor, patient] = await Promise.all([
    prisma.prescription.create({
      data: {
        consultationId: consultation.id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        notes: input.notes,
        items: { create: input.items },
      },
      include: { items: true },
    }),
    prisma.doctor.findUnique({ where: { id: consultation.doctorId }, select: { fullName: true } }),
    prisma.patient.findUnique({ where: { id: consultation.patientId }, select: { userId: true } }),
  ]);

  if (patient) {
    await createNotification(
      patient.userId,
      NotificationType.PRESCRIPTION_CREATED,
      "New prescription",
      `Dr. ${doctor?.fullName} added a new prescription to your record.`,
      { prescriptionId: prescription.id }
    );
  }

  return prescription;
}

export async function listPrescriptionsForPatient(requester: AuthUser, patientId: string) {
  if (requester.role === Role.PATIENT && requester.patientId !== patientId) throw ApiError.forbidden();
  return prisma.prescription.findMany({
    where: { patientId },
    include: {
      items: true,
      doctor: { select: { id: true, fullName: true, specialty: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
