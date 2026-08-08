import { env, isGroqConfigured } from "../../config/env";
import { logger } from "../../config/logger";
import { ApiError } from "../../utils/ApiError";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallOptions {
  jsonMode?: boolean;
  temperature?: number;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getKeyPool(): string[] {
  return [env.groq.apiKey, ...env.groq.fallbackKeys].filter(Boolean);
}

async function callWithKey(key: string, messages: ChatMessage[], options: CallOptions) {
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
  return data.choices?.[0]?.message?.content as string;
}

export async function chatCompletion(messages: ChatMessage[], options: CallOptions = {}): Promise<string> {
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
