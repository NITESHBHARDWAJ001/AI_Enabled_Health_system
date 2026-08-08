import { PrismaClient, Role, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const password = await hash("Password123!");

  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@hop.dev" },
    update: {},
    create: {
      email: "superadmin@hop.dev",
      passwordHash: password,
      role: Role.SUPER_ADMIN,
    },
  });

  const hospital = await prisma.hospital.upsert({
    where: { id: "seed-hospital-001" },
    update: {},
    create: {
      id: "seed-hospital-001",
      name: "Sunrise General Hospital",
      address: "12 MG Road",
      city: "Bengaluru",
      phone: "+91-80-4000-1000",
      email: "contact@sunrisegeneral.dev",
      latitude: 12.9716,
      longitude: 77.5946,
      specialties: ["Cardiology", "General Medicine", "Orthopedics", "Pediatrics"],
      facilities: ["Emergency", "ICU", "Pharmacy", "Lab"],
    },
  });

  await prisma.department.upsert({
    where: { id: "seed-dept-cardio" },
    update: {},
    create: { id: "seed-dept-cardio", hospitalId: hospital.id, name: "Cardiology" },
  });
  await prisma.department.upsert({
    where: { id: "seed-dept-general" },
    update: {},
    create: { id: "seed-dept-general", hospitalId: hospital.id, name: "General Medicine" },
  });

  const hospitalAdminUser = await prisma.user.upsert({
    where: { email: "admin@hop.dev" },
    update: {},
    create: {
      email: "admin@hop.dev",
      passwordHash: password,
      role: Role.HOSPITAL_ADMIN,
    },
  });
  await prisma.hospitalAdmin.upsert({
    where: { userId: hospitalAdminUser.id },
    update: {},
    create: {
      userId: hospitalAdminUser.id,
      hospitalId: hospital.id,
      fullName: "Asha Rao",
    },
  });

  const doctor1User = await prisma.user.upsert({
    where: { email: "dr.sharma@hop.dev" },
    update: {},
    create: { email: "dr.sharma@hop.dev", passwordHash: password, role: Role.DOCTOR },
  });
  const doctor1 = await prisma.doctor.upsert({
    where: { userId: doctor1User.id },
    update: { fullName: "Rohan Sharma" },
    create: {
      userId: doctor1User.id,
      hospitalId: hospital.id,
      fullName: "Rohan Sharma",
      specialty: "Cardiology",
      qualification: "MD, DM Cardiology",
      experienceYears: 12,
      phone: "+91-98765-43210",
      bio: "Interventional cardiologist with a focus on preventive heart care.",
      consultationFee: 800,
    },
  });

  const doctor2User = await prisma.user.upsert({
    where: { email: "dr.iyer@hop.dev" },
    update: {},
    create: { email: "dr.iyer@hop.dev", passwordHash: password, role: Role.DOCTOR },
  });
  await prisma.doctor.upsert({
    where: { userId: doctor2User.id },
    update: { fullName: "Meera Iyer" },
    create: {
      userId: doctor2User.id,
      hospitalId: hospital.id,
      fullName: "Meera Iyer",
      specialty: "General Medicine",
      qualification: "MBBS, MD",
      experienceYears: 8,
      phone: "+91-98765-11223",
      bio: "General physician focused on holistic, longitudinal patient care.",
      consultationFee: 500,
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@hop.dev" },
    update: {},
    create: { email: "patient@hop.dev", passwordHash: password, role: Role.PATIENT },
  });
  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      fullName: "Nitesh Kumar",
      dob: new Date("1995-04-12"),
      gender: Gender.MALE,
      phone: "+91-90000-00000",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      address: "221B, Indiranagar, Bengaluru",
      emergencyContact: "+91-90000-11111",
    },
  });

  await prisma.vital.createMany({
    data: [
      { patientId: patient.id, type: "BLOOD_PRESSURE", value: 120, unit: "mmHg (sys)" },
      { patientId: patient.id, type: "HEART_RATE", value: 78, unit: "bpm" },
      { patientId: patient.id, type: "GLUCOSE", value: 96, unit: "mg/dL" },
      { patientId: patient.id, type: "WEIGHT", value: 72, unit: "kg" },
    ],
    skipDuplicates: true,
  });

  await prisma.patientCondition.upsert({
    where: { id: "seed-condition-htn" },
    update: {},
    create: {
      id: "seed-condition-htn",
      patientId: patient.id,
      name: "Mild Hypertension",
      status: "MANAGED",
      diagnosedAt: new Date("2024-02-01"),
      notes: "Managed with lifestyle changes, reviewed quarterly.",
    },
  });

  console.log("Seed complete.");
  console.log("Login credentials (password for all: Password123!):");
  console.log("  Super Admin:    superadmin@hop.dev");
  console.log("  Hospital Admin: admin@hop.dev");
  console.log("  Doctor:         dr.sharma@hop.dev (Cardiology)");
  console.log("  Doctor:         dr.iyer@hop.dev (General Medicine)");
  console.log("  Patient:        patient@hop.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
