import { AppointmentStatus, NotificationType, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";
import { isSlotAvailable } from "../doctors/availability.service";
import { createNotification } from "../notifications/notifications.service";

function formatForNotification(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface CreateAppointmentInput {
  doctorId: string;
  hospitalId?: string;
  scheduledAt: string;
  reason?: string;
  patientId?: string;
}

export async function createAppointment(requester: AuthUser, input: CreateAppointmentInput) {
  let patientId: string;
  if (requester.role === Role.PATIENT) {
    patientId = requester.patientId!;
  } else if (input.patientId) {
    patientId = input.patientId;
  } else {
    throw ApiError.badRequest("patientId is required when booking on behalf of a patient");
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: input.doctorId } });
  if (!doctor) throw ApiError.notFound("Doctor not found");

  const scheduledAt = new Date(input.scheduledAt);
  const available = await isSlotAvailable(input.doctorId, scheduledAt);
  if (!available) {
    throw ApiError.conflict("This slot is no longer available — please pick another time.");
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId: input.doctorId,
      hospitalId: input.hospitalId ?? doctor.hospitalId ?? undefined,
      scheduledAt,
      reason: input.reason,
    },
    include: {
      doctor: { select: { id: true, fullName: true, specialty: true } },
      patient: { select: { id: true, fullName: true } },
    },
  });

  await createNotification(
    doctor.userId,
    NotificationType.APPOINTMENT_CREATED,
    "New appointment request",
    `${appointment.patient.fullName} requested an appointment on ${formatForNotification(scheduledAt)}.`,
    { appointmentId: appointment.id }
  );

  return appointment;
}

export async function listAppointments(requester: AuthUser, statusFilter?: AppointmentStatus) {
  const where: any = { status: statusFilter };
  if (requester.role === Role.PATIENT) where.patientId = requester.patientId;
  if (requester.role === Role.DOCTOR) where.doctorId = requester.doctorId;
  if (requester.role === Role.HOSPITAL_ADMIN) where.hospitalId = requester.hospitalId;

  return prisma.appointment.findMany({
    where,
    include: {
      doctor: { select: { id: true, fullName: true, specialty: true } },
      patient: { select: { id: true, fullName: true } },
      hospital: { select: { id: true, name: true } },
      consultation: { select: { id: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

async function assertAppointmentAccess(requester: AuthUser, appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw ApiError.notFound("Appointment not found");

  if (requester.role === Role.PATIENT && appointment.patientId !== requester.patientId) {
    throw ApiError.forbidden();
  }
  if (requester.role === Role.DOCTOR && appointment.doctorId !== requester.doctorId) {
    throw ApiError.forbidden();
  }
  return appointment;
}

export async function getAppointmentById(requester: AuthUser, id: string) {
  await assertAppointmentAccess(requester, id);
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: { select: { id: true, fullName: true, specialty: true } },
      patient: true,
      hospital: { select: { id: true, name: true } },
      consultation: true,
    },
  });
}

export async function updateAppointmentStatus(requester: AuthUser, id: string, status: AppointmentStatus) {
  const existing = await assertAppointmentAccess(requester, id);
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      patient: { select: { userId: true } },
      doctor: { select: { fullName: true } },
    },
  });

  if (existing.status !== status) {
    await createNotification(
      appointment.patient.userId,
      NotificationType.APPOINTMENT_STATUS_CHANGED,
      "Appointment update",
      `Your appointment with Dr. ${appointment.doctor.fullName} on ${formatForNotification(appointment.scheduledAt)} is now ${status.toLowerCase()}.`,
      { appointmentId: appointment.id, status }
    );
  }

  return appointment;
}
