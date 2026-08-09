import { env, isGroqConfigured } from "../../config/env";
import { logger } from "../../config/logger";
import { ApiError } from "../../utils/ApiError";

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface RawChatResult {
  content: string | null;
  tool_calls?: ToolCall[];
}

interface CallOptions {
  jsonMode?: boolean;
  temperature?: number;
  tools?: ToolDefinition[];
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getKeyPool(): string[] {
  return [env.groq.apiKey, ...env.groq.fallbackKeys].filter(Boolean);
}

async function callWithKey(key: string, messages: ChatMessage[], options: CallOptions): Promise<RawChatResult> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: env.groq.model,
      messages,
      temperature: options.temperature ?? 0.4,
      ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
      ...(options.tools ? { tools: options.tools } : {}),
    }),
  });

  if (!res.ok) {
    const retryable = res.status === 401 || res.status === 429 || res.status >= 500;
    const body = await res.text().catch(() => "");
    const err = new Error(`Groq request failed (${res.status}): ${body}`) as Error & { retryable?: boolean };
    err.retryable = retryable;
    throw err;
  }

  const data = (await res.json()) as any;
  const message = data.choices?.[0]?.message ?? {};
  return { content: message.content ?? null, tool_calls: message.tool_calls };
}

export async function chatCompletionRaw(messages: ChatMessage[], options: CallOptions = {}): Promise<RawChatResult> {
  if (!isGroqConfigured) {
    throw ApiError.internal("AI assistant is not configured (missing GROQ_API_KEY)");
  }

  const keys = getKeyPool();
  let lastError: unknown;

  for (const key of keys) {
    try {
      return await callWithKey(key, messages, options);
    } catch (err: any) {
      lastError = err;
      logger.warn({ err: err?.message }, "Groq key failed, trying next fallback if available");
      if (!err?.retryable) break;
    }
  }

  logger.error({ err: lastError }, "All Groq keys exhausted");
  throw ApiError.internal("AI assistant is temporarily unavailable, please try again shortly");
}

export async function chatCompletion(messages: ChatMessage[], options: CallOptions = {}): Promise<string> {
  const result = await chatCompletionRaw(messages, options);
  return result.content ?? "";
}
