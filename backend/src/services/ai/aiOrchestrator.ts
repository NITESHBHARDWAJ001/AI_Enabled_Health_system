import { AIConversationType, AIMessageRole, Role } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";
import { chatCompletion, chatCompletionRaw, ChatMessage, ToolDefinition } from "./llmClient";
import * as chatService from "./chatService";
import { analyzeSymptomsFromText } from "./symptomAnalyzer";
import { calculateDiseaseRisk, DiseaseRiskInput } from "./tools/calculateDiseaseRisk";
import { persistScreeningResult } from "./tools/persistScreeningResult";
import { logger } from "../../config/logger";
import {
  patientAssistantSystemPrompt,
  doctorAssistantSystemPrompt,
  symptomIntakeSystemPrompt,
} from "./promptManager";

const CALCULATE_RISK_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "calculate_disease_risk",
    description:
      "Calculates chronic disease risk (diabetes, hypertension, cardiovascular) from patient vitals using a validated offline logistic regression model. Call this whenever the user has provided enough vitals to estimate risk, instead of estimating the numbers yourself.",
    parameters: {
      type: "object",
      properties: {
        age_years: { type: "number", description: "age in years" },
        sex_female: { type: "number", description: "1 if female, 0 if male" },
        bmi: { type: "number", description: "body mass index" },
        smoker_ever: { type: "number", description: "1 if ever smoked, 0 otherwise" },
        smoker_current: { type: "number", description: "1 if currently smokes, 0 otherwise" },
        alcohol_heavy: { type: "number", description: "1 if heavy alcohol use, 0 otherwise" },
        physically_active: { type: "number", description: "1 if physically active, 0 otherwise" },
        gen_health: { type: "number", description: "self-rated general health, 1 (excellent) to 5 (poor)" },
        diff_walking: { type: "number", description: "1 if difficulty walking/climbing stairs, 0 otherwise" },
        told_high_chol: { type: "number", description: "1 if ever told high cholesterol, 0 otherwise" },
        kidney_disease: { type: "number", description: "1 if diagnosed kidney disease, 0 otherwise" },
        stroke_history: { type: "number", description: "1 if history of stroke, 0 otherwise" },
        has_healthplan: { type: "number", description: "1 if has health insurance/coverage, 0 otherwise" },
      },
    },
  },
};

const TOOL_ENABLED_TYPES = new Set<AIConversationType>([
  AIConversationType.PATIENT_ASSISTANT,
  AIConversationType.SYMPTOM_INTAKE,
]);

async function maybeRunToolCalls(patientId: string, notifyUserId: string, systemPrompt: string, history: ChatMessage[]) {
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...history];

  const first = await chatCompletionRaw(messages, { tools: [CALCULATE_RISK_TOOL] });
  if (!first.tool_calls?.length) {
    return first.content ?? "";
  }

  messages.push({ role: "assistant", content: first.content, tool_calls: first.tool_calls });

  for (const call of first.tool_calls) {
    if (call.function.name !== "calculate_disease_risk") continue;

    let args: DiseaseRiskInput = {};
    try {
      args = JSON.parse(call.function.arguments);
    } catch (err) {
      logger.warn({ err }, "Failed to parse calculate_disease_risk tool arguments");
    }

    const result = calculateDiseaseRisk(args);

    try {
      await persistScreeningResult(patientId, notifyUserId, args, result);
    } catch (err) {
      logger.error({ err }, "Failed to persist chat-triggered screening result");
    }

    messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
  }

  const second = await chatCompletionRaw(messages);
  return (
    second.content ??
    "I've calculated your risk estimate — please check your screening results, and discuss them with your doctor."
  );
}

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

  const reply = TOOL_ENABLED_TYPES.has(conversation.type)
    ? await maybeRunToolCalls(conversation.patientId, requester.id, systemPrompt, history)
    : await chatCompletion([{ role: "system", content: systemPrompt }, ...history]);

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

export async function saveScreeningRisk(
  requester: AuthUser,
  input: { patientId: string; inputSnapshot: any; output: any }
) {
  if (requester.role === Role.PATIENT && requester.patientId !== input.patientId) throw ApiError.forbidden();

  return persistScreeningResult(input.patientId, requester.id, input.inputSnapshot, input.output);
}
