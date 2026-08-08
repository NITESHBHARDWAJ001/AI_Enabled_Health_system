export type Role = "PATIENT" | "DOCTOR" | "HOSPITAL_ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  profile: PatientProfile | DoctorProfile | HospitalAdminProfile | null;
}

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  dob?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  phone?: string | null;
  bloodGroup?: string | null;
  allergies: string[];
  address?: string | null;
  emergencyContact?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationUpdatedAt?: string | null;
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  specialty: string;
  qualification?: string | null;
  experienceYears?: number | null;
  phone?: string | null;
  bio?: string | null;
  consultationFee?: number | null;
  hospitalId?: string | null;
  hospital?: { id: string; name: string; city?: string | null };
}

export interface HospitalAdminProfile {
  id: string;
  userId: string;
  hospitalId: string;
  fullName: string;
}

export interface Hospital {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  specialties: string[];
  facilities: string[];
  departments?: { id: string; name: string }[];
  doctors?: { id: string; fullName: string; specialty: string; consultationFee?: number | null }[];
}

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string | null;
  scheduledAt: string;
  status: AppointmentStatus;
  reason?: string | null;
  createdAt: string;
  doctor?: { id: string; fullName: string; specialty: string };
  patient?: { id: string; fullName: string };
  hospital?: { id: string; name: string };
  consultation?: { id: string } | null;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  symptoms?: unknown;
  observations?: string | null;
  aiSummary?: string | null;
  doctorNotes?: string | null;
  startedAt: string;
  endedAt?: string | null;
  diagnosis?: Diagnosis | null;
  prescription?: Prescription | null;
  patient?: { id: string; fullName: string };
  doctor?: { id: string; fullName: string; specialty: string };
}

export interface Diagnosis {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  conditionName: string;
  description?: string | null;
  aiSuggested: boolean;
  confirmedByDoctor: boolean;
  isContagious: boolean;
  contagionCategory?: string | null;
  createdAt: string;
  doctor?: { id: string; fullName: string; specialty: string };
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  notes?: string | null;
  createdAt: string;
  items: PrescriptionItem[];
  doctor?: { id: string; fullName: string; specialty: string };
}

export interface MedicalDocument {
  id: string;
  patientId: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  storageProvider: "CLOUDINARY" | "LOCAL";
  uploadedAt: string;
}

export interface Vital {
  id: string;
  patientId: string;
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface PatientCondition {
  id: string;
  patientId: string;
  name: string;
  status: "ACTIVE" | "RESOLVED" | "MANAGED";
  diagnosedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  type: "APPOINTMENT" | "CONSULTATION" | "DIAGNOSIS" | "PRESCRIPTION" | "DOCUMENT" | "VITAL" | "CONDITION";
  date: string;
  title: string;
  summary?: string | null;
  meta?: Record<string, unknown>;
}

export type AIConversationType = "PATIENT_ASSISTANT" | "DOCTOR_ASSISTANT" | "SYMPTOM_INTAKE";
export type AIMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface AIMessage {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  patientId: string;
  doctorId?: string | null;
  type: AIConversationType;
  startedAt: string;
  endedAt?: string | null;
  messages: AIMessage[];
}

export interface DoctorAvailabilityWindow {
  id?: string;
  dayOfWeek: number; // 0=Sunday .. 6=Saturday
  startMinutes: number;
  endMinutes: number;
}

export type NotificationType =
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_STATUS_CHANGED"
  | "PRESCRIPTION_CREATED"
  | "DIAGNOSIS_CREATED"
  | "INFECTION_ALERT";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface InfectionAlert {
  id: string;
  hospitalId: string;
  category: string;
  radiusKm: number;
  notifiedCount: number;
  createdAt: string;
}
