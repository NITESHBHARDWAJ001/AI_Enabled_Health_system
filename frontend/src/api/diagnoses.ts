import { api } from "./client";
import type { Diagnosis } from "@/types";

export async function createDiagnosis(data: {
  consultationId: string;
  conditionName: string;
  description?: string;
  aiSuggested?: boolean;
  isContagious?: boolean;
  contagionCategory?: string;
}) {
  const res = await api.post("/diagnoses", data);
  return res.data.data as Diagnosis;
}

export async function listDiagnosesForPatient(patientId: string) {
  const res = await api.get(`/diagnoses/patient/${patientId}`);
  return res.data.data as Diagnosis[];
}
