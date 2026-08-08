import { Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";

export type TimelineEntry = {
  id: string;
  type: "APPOINTMENT" | "CONSULTATION" | "DIAGNOSIS" | "PRESCRIPTION" | "DOCUMENT" | "VITAL" | "CONDITION";
  date: Date;
  title: string;
  summary?: string | null;
  meta?: Record<string, unknown>;
};

function assertAccess(requester: AuthUser, patientId: string) {
  if (requester.role === Role.PATIENT && requester.patientId !== patientId) {
    throw ApiError.forbidden("You can only access your own timeline");
  }
}

export async function getPatientTimeline(requester: AuthUser, patientId: string) {
  assertAccess(requester, patientId);

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw ApiError.notFound("Patient not found");

  const [appointments, diagnoses, prescriptions, documents, conditions] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: { select: { fullName: true, specialty: true } } },
    }),
    prisma.diagnosis.findMany({
      where: { patientId },
      include: { doctor: { select: { fullName: true } } },
    }),
    prisma.prescription.findMany({
      where: { patientId },
      include: { items: true, doctor: { select: { fullName: true } } },
    }),
    prisma.medicalDocument.findMany({ where: { patientId } }),
    prisma.patientCondition.findMany({ where: { patientId } }),
  ]);

  const entries: TimelineEntry[] = [];

  for (const a of appointments) {
    entries.push({
      id: a.id,
      type: "APPOINTMENT",
      date: a.scheduledAt,
      title: `Appointment with Dr. ${a.doctor.fullName}`,
      summary: a.reason,
      meta: { status: a.status, specialty: a.doctor.specialty },
    });
  }
  for (const d of diagnoses) {
    entries.push({
      id: d.id,
      type: "DIAGNOSIS",
      date: d.createdAt,
      title: d.conditionName,
      summary: d.description,
      meta: { doctor: d.doctor.fullName, aiSuggested: d.aiSuggested, confirmedByDoctor: d.confirmedByDoctor },
    });
  }
  for (const p of prescriptions) {
    entries.push({
      id: p.id,
      type: "PRESCRIPTION",
      date: p.createdAt,
      title: `Prescription from Dr. ${p.doctor.fullName}`,
      summary: p.items.map((i) => i.medicineName).join(", "),
      meta: { items: p.items },
    });
  }
  for (const doc of documents) {
    entries.push({
      id: doc.id,
      type: "DOCUMENT",
      date: doc.uploadedAt,
      title: doc.fileName,
      summary: doc.documentType,
      meta: { fileUrl: doc.fileUrl, mimeType: doc.mimeType },
    });
  }
  for (const c of conditions) {
    entries.push({
      id: c.id,
      type: "CONDITION",
      date: c.diagnosedAt ?? c.createdAt,
      title: c.name,
      summary: c.notes,
      meta: { status: c.status },
    });
  }

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { patient: { id: patient.id, fullName: patient.fullName }, timeline: entries };
}

export async function getPatientSummary(requester: AuthUser, patientId: string) {
  assertAccess(requester, patientId);

  const [conditionsCount, documentsCount, upcomingAppointment, latestVitals] = await Promise.all([
    prisma.patientCondition.count({ where: { patientId, status: { in: ["ACTIVE", "MANAGED"] } } }),
    prisma.medicalDocument.count({ where: { patientId } }),
    prisma.appointment.findFirst({
      where: { patientId, scheduledAt: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } },
      orderBy: { scheduledAt: "asc" },
      include: { doctor: { select: { fullName: true, specialty: true } } },
    }),
    prisma.vital.findMany({ where: { patientId }, orderBy: { recordedAt: "desc" }, take: 6 }),
  ]);

  return { conditionsCount, documentsCount, upcomingAppointment, latestVitals };
}
