import { Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";

export async function createConsultation(
  requester: AuthUser,
  input: { appointmentId: string; symptoms?: unknown; observations?: string }
) {
  if (requester.role !== Role.DOCTOR) throw ApiError.forbidden("Only doctors can start a consultation");

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { consultation: true },
  });
  if (!appointment) throw ApiError.notFound("Appointment not found");
  if (appointment.doctorId !== requester.doctorId) throw ApiError.forbidden();
  if (appointment.consultation) throw ApiError.conflict("A consultation already exists for this appointment");

  const consultation = await prisma.consultation.create({
    data: {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      symptoms: input.symptoms as any,
      observations: input.observations,
    },
  });

  await prisma.appointment.update({ where: { id: appointment.id }, data: { status: "CONFIRMED" } });

  return consultation;
}

async function assertConsultationAccess(requester: AuthUser, consultationId: string) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw ApiError.notFound("Consultation not found");

  if (requester.role === Role.PATIENT && consultation.patientId !== requester.patientId) throw ApiError.forbidden();
  if (requester.role === Role.DOCTOR && consultation.doctorId !== requester.doctorId) throw ApiError.forbidden();
  return consultation;
}

export async function getConsultationById(requester: AuthUser, id: string) {
  await assertConsultationAccess(requester, id);
  return prisma.consultation.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, fullName: true, specialty: true } },
      diagnosis: true,
      prescription: { include: { items: true } },
    },
  });
}

export async function updateConsultation(
  requester: AuthUser,
  id: string,
  input: { symptoms?: unknown; observations?: string; doctorNotes?: string; aiSummary?: string; endConsultation?: boolean }
) {
  const consultation = await assertConsultationAccess(requester, id);
  if (requester.role !== Role.DOCTOR) throw ApiError.forbidden("Only the treating doctor can update this consultation");

  return prisma.consultation.update({
    where: { id: consultation.id },
    data: {
      symptoms: input.symptoms as any,
      observations: input.observations,
      doctorNotes: input.doctorNotes,
      aiSummary: input.aiSummary,
      endedAt: input.endConsultation ? new Date() : undefined,
    },
  });
}
