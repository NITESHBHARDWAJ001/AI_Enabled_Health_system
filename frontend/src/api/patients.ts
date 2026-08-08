import { api } from "./client";
import type { PatientProfile, PatientCondition, Vital } from "@/types";

export async function getPatient(id: string) {
  const res = await api.get(`/patients/${id}`);
  return res.data.data as PatientProfile & { conditions: PatientCondition[]; vitals: Vital[] };
}

export async function updatePatient(id: string, data: Partial<PatientProfile>) {
  const res = await api.patch(`/patients/${id}`, data);
  return res.data.data as PatientProfile;
}

export async function listPatients(search?: string) {
  const res = await api.get("/patients", { params: { search } });
  return res.data.data as PatientProfile[];
}

export async function updateLocation(patientId: string, latitude: number, longitude: number) {
  const res = await api.patch(`/patients/${patientId}/location`, { latitude, longitude });
  return res.data.data as { id: string; latitude: number; longitude: number; locationUpdatedAt: string };
}

export async function addVital(patientId: string, data: { type: string; value: number; unit: string }) {
  const res = await api.post(`/patients/${patientId}/vitals`, data);
  return res.data.data as Vital;
}

export async function listVitals(patientId: string) {
  const res = await api.get(`/patients/${patientId}/vitals`);
  return res.data.data as Vital[];
}

export async function addCondition(
  patientId: string,
  data: { name: string; status?: string; diagnosedAt?: string; notes?: string }
) {
  const res = await api.post(`/patients/${patientId}/conditions`, data);
  return res.data.data as PatientCondition;
}

export async function listConditions(patientId: string) {
  const res = await api.get(`/patients/${patientId}/conditions`);
  return res.data.data as PatientCondition[];
}
