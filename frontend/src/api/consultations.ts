import { api } from "./client";
import type { Consultation } from "@/types";

export async function createConsultation(data: { appointmentId: string; symptoms?: unknown; observations?: string }) {
  const res = await api.post("/consultations", data);
  return res.data.data as Consultation;
}

export async function getConsultation(id: string) {
  const res = await api.get(`/consultations/${id}`);
  return res.data.data as Consultation;
}

export async function updateConsultation(
  id: string,
  data: { symptoms?: unknown; observations?: string; doctorNotes?: string; aiSummary?: string; endConsultation?: boolean }
) {
  const res = await api.patch(`/consultations/${id}`, data);
  return res.data.data as Consultation;
}
