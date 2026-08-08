import { api } from "./client";
import type { InfectionAlert } from "@/types";

export async function listInfectionAlerts(hospitalId: string) {
  const res = await api.get(`/hospitals/${hospitalId}/infection-alerts`);
  return res.data.data as InfectionAlert[];
}
