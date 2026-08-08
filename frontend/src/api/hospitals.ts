import { api } from "./client";
import type { Hospital } from "@/types";

export async function listHospitals() {
  const res = await api.get("/hospitals");
  return res.data.data as Hospital[];
}

export async function getHospital(id: string) {
  const res = await api.get(`/hospitals/${id}`);
  return res.data.data as Hospital;
}

export async function createHospital(data: Partial<Hospital>) {
  const res = await api.post("/hospitals", data);
  return res.data.data as Hospital;
}

export async function updateHospital(id: string, data: Partial<Hospital>) {
  const res = await api.patch(`/hospitals/${id}`, data);
  return res.data.data as Hospital;
}
