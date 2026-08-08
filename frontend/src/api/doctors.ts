import { api } from "./client";
import type { DoctorProfile, DoctorAvailabilityWindow } from "@/types";

export async function listDoctors(filters?: { specialty?: string; hospitalId?: string; search?: string }) {
  const res = await api.get("/doctors", { params: filters });
  return res.data.data as DoctorProfile[];
}

export async function getDoctor(id: string) {
  const res = await api.get(`/doctors/${id}`);
  return res.data.data as DoctorProfile;
}

export async function createDoctor(data: {
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
}) {
  const res = await api.post("/doctors", data);
  return res.data.data as DoctorProfile;
}

export async function updateDoctor(id: string, data: Partial<DoctorProfile>) {
  const res = await api.patch(`/doctors/${id}`, data);
  return res.data.data as DoctorProfile;
}

export async function getAvailability(doctorId: string) {
  const res = await api.get(`/doctors/${doctorId}/availability`);
  return res.data.data as DoctorAvailabilityWindow[];
}

export async function setAvailability(doctorId: string, windows: DoctorAvailabilityWindow[]) {
  const res = await api.put(`/doctors/${doctorId}/availability`, { windows });
  return res.data.data as DoctorAvailabilityWindow[];
}

export async function getAvailableSlots(doctorId: string, date: string) {
  const res = await api.get(`/doctors/${doctorId}/available-slots`, { params: { date } });
  return res.data.data as string[];
}
