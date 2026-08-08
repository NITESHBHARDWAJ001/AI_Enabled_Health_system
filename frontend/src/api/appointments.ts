import { api } from "./client";
import type { Appointment, AppointmentStatus } from "@/types";

export async function createAppointment(data: {
  doctorId: string;
  hospitalId?: string;
  scheduledAt: string;
  reason?: string;
  patientId?: string;
}) {
  const res = await api.post("/appointments", data);
  return res.data.data as Appointment;
}

export async function listAppointments(status?: AppointmentStatus) {
  const res = await api.get("/appointments", { params: { status } });
  return res.data.data as Appointment[];
}

export async function getAppointment(id: string) {
  const res = await api.get(`/appointments/${id}`);
  return res.data.data as Appointment;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const res = await api.patch(`/appointments/${id}/status`, { status });
  return res.data.data as Appointment;
}
