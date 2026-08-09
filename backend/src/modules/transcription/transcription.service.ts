import { ApiError } from "../../utils/ApiError";

const TRANSCRIPTION_SERVICE_URL = process.env.TRANSCRIPTION_SERVICE_URL || "http://localhost:8001";

interface TranscribeInput {
  audio?: Express.Multer.File;
  document?: Express.Multer.File;
  language?: string;
  ocrLang?: string;
}

// Uses Node's built-in fetch/FormData/Blob (Node 18+) - no extra npm
// dependency needed to talk to the Python microservice.
export async function transcribe(input: TranscribeInput) {
  const form = new FormData();

  if (input.audio) {
    form.append("audio", new Blob([input.audio.buffer], { type: input.audio.mimetype }), input.audio.originalname);
  }
  if (input.document) {
    form.append(
      "document",
      new Blob([input.document.buffer], { type: input.document.mimetype }),
      input.document.originalname
    );
  }
  if (input.language) form.append("language", input.language);
  if (input.ocrLang) form.append("ocr_lang", input.ocrLang);

  let response: Response;
  try {
    response = await fetch(`${TRANSCRIPTION_SERVICE_URL}/transcribe`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw ApiError.internal("Transcription service is unreachable. Is the Python service running?");
  }

  const json = await response.json();

  if (!response.ok) {
    throw ApiError.badRequest(json.detail || "Transcription failed");
  }

  // { audio_transcript: {...} | null, document_transcript: {...} | null }
  return json.data;
}
