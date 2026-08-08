import { AIConversationType, AIMessageRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";

export async function createConversation(patientId: string, doctorId: string | undefined, type: AIConversationType) {
  return prisma.aIConversation.create({
    data: { patientId, doctorId, type },
  });
}

export async function getConversation(conversationId: string) {
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw ApiError.notFound("Conversation not found");
  return conversation;
}

export async function listConversationsForPatient(patientId: string) {
  return prisma.aIConversation.findMany({
    where: { patientId },
    orderBy: { startedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
}

export async function appendMessage(conversationId: string, role: AIMessageRole, content: string) {
  return prisma.aIMessage.create({ data: { conversationId, role, content } });
}

export function toChatHistory(messages: { role: AIMessageRole; content: string }[]) {
  return messages.map((m) => ({
    role: m.role === "USER" ? ("user" as const) : m.role === "ASSISTANT" ? ("assistant" as const) : ("system" as const),
    content: m.content,
  }));
}
