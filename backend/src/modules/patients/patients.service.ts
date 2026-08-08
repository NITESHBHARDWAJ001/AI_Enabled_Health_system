import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";

export function assertPatientAccess(user: AuthUser, patientId: string) {
  if (user.role === Role.PATIENT && user.patientId !== patientId) {
    throw ApiError.forbidden("You can only access your own records");
  }
}

export async function listPatients(search?: string) {
  return prisma.patient.findMany({
    where: search
      ? { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } }
      : undefined,
    select: { id: true, fullName: true, phone: true, gender: true, dob: true, bloodGroup: true },
    orderBy: { fullName: "asc" },
    take: 50,
  });
}

export async function getPatientById(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      conditions: { orderBy: { createdAt: "desc" } },
      vitals: { orderBy: { recordedAt: "desc" }, take: 20 },
    },
  });
  if (!patient) throw ApiError.notFound("Patient not found");
  return patient;
}

export async function updatePatient(patientId: string, data: Prisma.PatientUpdateInput) {
  return prisma.patient.update({ where: { id: patientId }, data });
}

export async function updateLocation(patientId: string, latitude: number, longitude: number) {
  return prisma.patient.update({
    where: { id: patientId },
    data: { latitude, longitude, locationUpdatedAt: new Date() },
    select: { id: true, latitude: true, longitude: true, locationUpdatedAt: true },
  });
}

export async function addVital(patientId: string, data: { type: any; value: number; unit: string }) {
  return prisma.vital.create({ data: { patientId, ...data } });
}

export async function listVitals(patientId: string) {
  return prisma.vital.findMany({ where: { patientId }, orderBy: { recordedAt: "desc" } });
}

export async function addCondition(
  patientId: string,
  data: { name: string; status?: any; diagnosedAt?: string; notes?: string }
) {
  return prisma.patientCondition.create({
    data: {
      patientId,
      name: data.name,
      status: data.status,
      diagnosedAt: data.diagnosedAt ? new Date(data.diagnosedAt) : undefined,
      notes: data.notes,
    },
  });
}

export async function listConditions(patientId: string) {
  return prisma.patientCondition.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } });
}
