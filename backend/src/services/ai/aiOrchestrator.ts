import { AIConversationType, AIMessageRole, Role } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";
import { chatCompletion } from "./llmClient";
import * as chatService from "./chatService";
import { analyzeSymptomsFromText } from "./symptomAnalyzer";
import {
  patientAssistantSystemPrompt,
  doctorAssistantSystemPrompt,
  symptomIntakeSystemPrompt,
} from "./promptManager";

function systemPromptFor(type: AIConversationType) {
  switch (type) {
    case AIConversationType.DOCTOR_ASSISTANT:
      return doctorAssistantSystemPrompt();
    case AIConversationType.SYMPTOM_INTAKE:
      return symptomIntakeSystemPrompt();
    default:
      return patientAssistantSystemPrompt();
  }
}

function assertConversationAccess(requester: AuthUser, conversation: { patientId: string; doctorId: string | null; type: AIConversationType }) {
  if (conversation.type === AIConversationType.DOCTOR_ASSISTANT) {
    if (requester.role !== Role.DOCTOR || requester.doctorId !== conversation.doctorId) {
      throw ApiError.forbidden();
    }
    return;
  }
  if (requester.role === Role.PATIENT && requester.patientId !== conversation.patientId) {
    throw ApiError.forbidden();
  }
}

export async function startConversation(
  requester: AuthUser,
  input: { patientId?: string; type: AIConversationType }
) {
  let patientId: string;
  let doctorId: string | undefined;

  if (input.type === AIConversationType.DOCTOR_ASSISTANT) {
    if (requester.role !== Role.DOCTOR) throw ApiError.forbidden("Only doctors can start a doctor-assistant chat");
    if (!input.patientId) throw ApiError.badRequest("patientId is required");
    patientId = input.patientId;
    doctorId = requester.doctorId;
  } else {
    if (requester.role !== Role.PATIENT) throw ApiError.forbidden("Only patients can start this conversation type");
    patientId = requester.patientId!;
  }

  return chatService.createConversation(patientId, doctorId, input.type);
}

export async function sendMessage(requester: AuthUser, conversationId: string, content: string) {
  const conversation = await chatService.getConversation(conversationId);
  assertConversationAccess(requester, conversation);

  await chatService.appendMessage(conversationId, AIMessageRole.USER, content);

  const history = chatService.toChatHistory([...conversation.messages, { role: AIMessageRole.USER, content }]);
  const systemPrompt = systemPromptFor(conversation.type);

  const reply = await chatCompletion([{ role: "system", content: systemPrompt }, ...history]);

  const assistantMessage = await chatService.appendMessage(conversationId, AIMessageRole.ASSISTANT, reply);

  return { reply: assistantMessage };
}

export async function getConversation(requester: AuthUser, conversationId: string) {
  const conversation = await chatService.getConversation(conversationId);
  assertConversationAccess(requester, conversation);
  return conversation;
}

export async function listConversations(requester: AuthUser, patientId: string) {
  if (requester.role === Role.PATIENT && requester.patientId !== patientId) throw ApiError.forbidden();
  return chatService.listConversationsForPatient(patientId);
}

export async function runSymptomAnalysis(
  requester: AuthUser,
  input: { patientId: string; conversationId?: string; freeText?: string }
) {
  if (requester.role === Role.PATIENT && requester.patientId !== input.patientId) throw ApiError.forbidden();

  let transcript = input.freeText ?? "";
  if (input.conversationId) {
    const conversation = await chatService.getConversation(input.conversationId);
    assertConversationAccess(requester, conversation);
    transcript = conversation.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  }

  if (!transcript.trim()) throw ApiError.badRequest("Provide either conversationId or freeText to analyze");

  return analyzeSymptomsFromText(input.patientId, input.conversationId, transcript);
}
