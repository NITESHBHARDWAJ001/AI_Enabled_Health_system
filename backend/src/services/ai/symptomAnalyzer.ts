import { AnalysisSource } from "@prisma/client";
import { prisma } from "../../config/database";
import { chatCompletion } from "./llmClient";
import { symptomExtractionPrompt } from "./promptManager";
import { logger } from "../../config/logger";

interface StructuredSymptoms {
  chief_complaint: string;
  symptoms: { name: string; duration: string | null; severity: number | null }[];
  associated_symptoms: string[];
  medical_history: string[];
  medications: string[];
  missing_information: string[];
}

function safeParseJson(raw: string): StructuredSymptoms | null {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        logger.warn("Failed to parse LLM JSON output even after extracting braces");
      }
    }
    return null;
  }
}

export async function analyzeSymptomsFromText(
  patientId: string,
  conversationId: string | undefined,
  conversationText: string
) {
  const raw = await chatCompletion(
    [{ role: "user", content: symptomExtractionPrompt(conversationText) }],
    { jsonMode: true, temperature: 0.2 }
  );

  const structured = safeParseJson(raw) ?? {
    chief_complaint: "Unable to structure automatically",
    symptoms: [],
    associated_symptoms: [],
    medical_history: [],
    medications: [],
    missing_information: ["Automatic extraction failed — review the raw conversation."],
  };

  const analysis = await prisma.aIAnalysis.create({
    data: {
      patientId,
      conversationId,
      analysisType: "symptom_extraction",
      source: AnalysisSource.LLM_FALLBACK,
      inputSnapshot: { conversationText },
      output: structured as any,
    },
  });

  return analysis;
}
