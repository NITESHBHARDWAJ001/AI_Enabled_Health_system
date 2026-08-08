import { AppointmentStatus, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";

export const SLOT_MINUTES = 30;

interface AvailabilityWindow {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

function dayStartUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function getWeeklyAvailability(doctorId: string) {
  return prisma.doctorAvailability.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
  });
}

export async function setWeeklyAvailability(requester: AuthUser, doctorId: string, windows: AvailabilityWindow[]) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw ApiError.notFound("Doctor not found");

  if (requester.role === Role.DOCTOR && requester.doctorId !== doctorId) {
    throw ApiError.forbidden("You can only manage your own availability");
  }
  if (requester.role === Role.HOSPITAL_ADMIN && requester.hospitalId !== doctor.hospitalId) {
    throw ApiError.forbidden("You can only manage doctors at your own hospital");
  }

  for (const w of windows) {
    if (w.endMinutes <= w.startMinutes) {
      throw ApiError.badRequest("Each availability window's end time must be after its start time");
    }
  }

  await prisma.$transaction([
    prisma.doctorAvailability.deleteMany({ where: { doctorId } }),
    prisma.doctorAvailability.createMany({
      data: windows.map((w) => ({ doctorId, ...w })),
    }),
  ]);

  return getWeeklyAvailability(doctorId);
}

export async function getAvailableSlots(doctorId: string, dateStr: string): Promise<string[]> {
  const dayStart = dayStartUTC(dateStr);
  if (Number.isNaN(dayStart.getTime())) throw ApiError.badRequest("Invalid date");

  const dayOfWeek = dayStart.getUTCDay();
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [windows, existingAppointments] = await Promise.all([
    prisma.doctorAvailability.findMany({ where: { doctorId, dayOfWeek } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { not: AppointmentStatus.CANCELLED },
      },
      select: { scheduledAt: true },
    }),
  ]);

  const occupied = new Set(existingAppointments.map((a) => a.scheduledAt.getTime()));
  const now = Date.now();

  const slots: string[] = [];
  for (const window of windows) {
    for (let minutes = window.startMinutes; minutes + SLOT_MINUTES <= window.endMinutes; minutes += SLOT_MINUTES) {
      const slotTime = new Date(dayStart.getTime() + minutes * 60 * 1000);
      if (slotTime.getTime() < now) continue;
      if (occupied.has(slotTime.getTime())) continue;
      slots.push(slotTime.toISOString());
    }
  }

  slots.sort();
  return slots;
}

export async function isSlotAvailable(doctorId: string, scheduledAt: Date): Promise<boolean> {
  const dateStr = scheduledAt.toISOString().slice(0, 10);
  const slots = await getAvailableSlots(doctorId, dateStr);
  return slots.includes(scheduledAt.toISOString());
}
