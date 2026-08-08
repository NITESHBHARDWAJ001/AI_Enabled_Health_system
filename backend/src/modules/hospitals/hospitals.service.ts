import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";

export async function listHospitals() {
  return prisma.hospital.findMany({
    include: { departments: true, _count: { select: { doctors: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getHospitalById(id: string) {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      departments: true,
      doctors: { select: { id: true, fullName: true, specialty: true, consultationFee: true } },
    },
  });
  if (!hospital) throw ApiError.notFound("Hospital not found");
  return hospital;
}

export async function createHospital(data: Prisma.HospitalCreateInput) {
  return prisma.hospital.create({ data });
}

export async function updateHospital(id: string, data: Prisma.HospitalUpdateInput) {
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) throw ApiError.notFound("Hospital not found");
  return prisma.hospital.update({ where: { id }, data });
}

export async function addDepartment(hospitalId: string, name: string) {
  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) throw ApiError.notFound("Hospital not found");
  return prisma.department.create({ data: { hospitalId, name } });
}

export async function listInfectionAlerts(hospitalId: string) {
  return prisma.infectionAlert.findMany({
    where: { hospitalId },
    orderBy: { createdAt: "desc" },
  });
}
