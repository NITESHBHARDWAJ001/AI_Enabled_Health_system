import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";

interface CreateDoctorInput {
  email: string;
  password: string;
  fullName: string;
  specialty: string;
  hospitalId: string;
  qualification?: string;
  experienceYears?: number;
  phone?: string;
  bio?: string;
  consultationFee?: number;
}

export async function listDoctors(filters: { specialty?: string; hospitalId?: string; search?: string }) {
  return prisma.doctor.findMany({
    where: {
      specialty: filters.specialty ? { equals: filters.specialty, mode: Prisma.QueryMode.insensitive } : undefined,
      hospitalId: filters.hospitalId || undefined,
      fullName: filters.search ? { contains: filters.search, mode: Prisma.QueryMode.insensitive } : undefined,
    },
    include: { hospital: { select: { id: true, name: true, city: true } } },
    orderBy: { fullName: "asc" },
  });
}

export async function getDoctorById(id: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { hospital: { select: { id: true, name: true, city: true } } },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  return doctor;
}

export async function createDoctor(requester: AuthUser, input: CreateDoctorInput) {
  if (requester.role === Role.HOSPITAL_ADMIN && requester.hospitalId !== input.hospitalId) {
    throw ApiError.forbidden("You can only add doctors to your own hospital");
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: Role.DOCTOR,
      doctor: {
        create: {
          fullName: input.fullName,
          specialty: input.specialty,
          hospitalId: input.hospitalId,
          qualification: input.qualification,
          experienceYears: input.experienceYears,
          phone: input.phone,
          bio: input.bio,
          consultationFee: input.consultationFee,
        },
      },
    },
    include: { doctor: true },
  });

  return user.doctor;
}

export async function updateDoctor(requester: AuthUser, doctorId: string, data: Prisma.DoctorUpdateInput) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw ApiError.notFound("Doctor not found");

  if (requester.role === Role.DOCTOR && requester.doctorId !== doctorId) {
    throw ApiError.forbidden("You can only update your own profile");
  }
  if (requester.role === Role.HOSPITAL_ADMIN && requester.hospitalId !== doctor.hospitalId) {
    throw ApiError.forbidden("You can only manage doctors at your own hospital");
  }

  return prisma.doctor.update({ where: { id: doctorId }, data });
}
