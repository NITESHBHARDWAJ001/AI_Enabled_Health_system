import { api } from "./client";
import type { AuthUser } from "@/types";

interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<Session> {
  const res = await api.post("/auth/login", { email, password });
  return res.data.data;
}

export async function registerPatient(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dob?: string;
  gender?: string;
}): Promise<Session> {
  const res = await api.post("/auth/register", input);
  return res.data.data;
}

export async function logout(refreshToken: string) {
  await api.post("/auth/logout", { refreshToken });
}

export async function me(): Promise<AuthUser> {
  const res = await api.get("/auth/me");
  return res.data.data;
}
