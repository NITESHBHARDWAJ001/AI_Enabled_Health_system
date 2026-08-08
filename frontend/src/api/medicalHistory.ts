import { api } from "./client";
import type { TimelineEntry, Vital } from "@/types";

export async function getTimeline(patientId: string) {
  const res = await api.get(`/medical-history/${patientId}/timeline`);
  return res.data.data as { patient: { id: string; fullName: string }; timeline: TimelineEntry[] };
}

export interface PatientSummary {
  conditionsCount: number;
  documentsCount: number;
  upcomingAppointment: any;
  latestVitals: Vital[];
}

export async function getSummary(patientId: string) {
  const res = await api.get(`/medical-history/${patientId}/summary`);
  return res.data.data as PatientSummary;
}
