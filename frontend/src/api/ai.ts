import { api } from "./client";
import type { AIConversation, AIConversationType, AIMessage } from "@/types";

export async function startConversation(type: AIConversationType, patientId?: string) {
  const res = await api.post("/ai/chat/conversations", { type, patientId });
  return res.data.data as AIConversation;
}

export async function sendMessage(conversationId: string, content: string) {
  const res = await api.post(`/ai/chat/conversations/${conversationId}/messages`, { content });
  return res.data.data as { reply: AIMessage };
}

export async function getConversation(conversationId: string) {
  const res = await api.get(`/ai/chat/conversations/${conversationId}`);
  return res.data.data as AIConversation;
}

export async function listConversations(patientId: string) {
  const res = await api.get(`/ai/chat/conversations/patient/${patientId}`);
  return res.data.data as AIConversation[];
}

export async function runSymptomAnalysis(input: { patientId: string; conversationId?: string; freeText?: string }) {
  const res = await api.post("/ai/symptom-analysis", input);
  return res.data.data;
}

export interface ScreeningResult {
  diabetes: { probability: number; band: string };
  hypertension: { probability: number; band: string };
  cvd: { probability: number; band: string };
}

export async function submitScreening(input: { patientId: string; inputSnapshot: unknown; output: ScreeningResult }) {
  const res = await api.post("/ai/screening", input);
  return res.data.data;
}
