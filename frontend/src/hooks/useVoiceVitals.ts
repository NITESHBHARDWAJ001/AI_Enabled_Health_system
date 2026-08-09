import { useSpeechRecognition } from "./useSpeechRecognition";
import { extractVitalsFromSpeech, type ParsedVitals } from "@/lib/voiceVitalsParser";

/**
 * Hindi-language variant of useSpeechRecognition that runs each final transcript
 * through the vitals parser and hands the caller structured field updates.
 */
export function useVoiceVitals(onVitalsUpdate: (vitals: ParsedVitals) => void) {
  return useSpeechRecognition(
    (finalText) => {
      onVitalsUpdate(extractVitalsFromSpeech(finalText));
    },
    { lang: "hi-IN", continuous: false }
  );
}
