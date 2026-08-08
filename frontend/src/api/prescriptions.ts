import { api } from "./client";
import type { Prescription, PrescriptionItem } from "@/types";

export async function createPrescription(data: {
  consultationId: string;
  notes?: string;
  items: Omit<PrescriptionItem, "id">[];
}) {
  const res = await api.post("/prescriptions", data);
  return res.data.data as Prescription;
}

export async function listPrescriptionsForPatient(patientId: string) {
  const res = await api.get(`/prescriptions/patient/${patientId}`);
  return res.data.data as Prescription[];
}
