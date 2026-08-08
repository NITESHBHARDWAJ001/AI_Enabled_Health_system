import { NotificationType } from "@prisma/client";
import { prisma } from "../../config/database";
import { haversineDistanceKm } from "../../utils/geo";
import { logger } from "../../config/logger";

const ALERT_RADIUS_KM = 5;

export async function triggerInfectionAlert(doctorId: string, diagnosedPatientId: string, category: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { hospital: { select: { id: true, name: true, latitude: true, longitude: true } } },
  });

  const hospital = doctor?.hospital;
  if (!hospital || hospital.latitude == null || hospital.longitude == null) {
    logger.warn({ doctorId }, "Skipping infection alert — hospital has no coordinates on file");
    return;
  }

  const nearbyPatients = await prisma.patient.findMany({
    where: {
      id: { not: diagnosedPatientId },
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { userId: true, latitude: true, longitude: true },
  });

  const matches = nearbyPatients.filter(
    (p) => haversineDistanceKm(hospital.latitude!, hospital.longitude!, p.latitude!, p.longitude!) <= ALERT_RADIUS_KM
  );

  if (matches.length > 0) {
    await prisma.notification.createMany({
      data: matches.map((p) => ({
        userId: p.userId,
        type: NotificationType.INFECTION_ALERT,
        title: `Health alert near ${hospital.name}`,
        message: `A ${category} case was reported near ${hospital.name}. Take precautions if you're in the area.`,
        data: { hospitalId: hospital.id, category, radiusKm: ALERT_RADIUS_KM },
      })),
    });
  }

  await prisma.infectionAlert.create({
    data: { hospitalId: hospital.id, category, radiusKm: ALERT_RADIUS_KM, notifiedCount: matches.length },
  });

  const admins = await prisma.hospitalAdmin.findMany({
    where: { hospitalId: hospital.id },
    select: { userId: true },
  });
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.userId,
          type: NotificationType.INFECTION_ALERT,
          title: "Infection alert sent",
          message: `A ${category} case was flagged at your hospital. ${matches.length} nearby patient(s) were notified.`,
          data: { hospitalId: hospital.id, category, notifiedCount: matches.length },
        },
      })
    )
  );
}
