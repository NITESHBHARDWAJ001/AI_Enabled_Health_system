// Hindi/Hinglish word-number -> digit map, used to normalize spoken ages before regex matching.
const textToNum: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  panch: 5,
  chhe: 6,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  bees: 20,
  bis: 20,
  tees: 30,
  tis: 30,
  chalis: 40,
  chaalis: 40,
  pachas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,
  sau: 100,
};

function normalizeWordNumbers(text: string): string {
  return text.replace(/[a-z]+/g, (word) => (textToNum[word] !== undefined ? String(textToNum[word]) : word));
}

export interface ParsedVitals {
  age_years: number | null;
  sex: "male" | "female" | null;
  bmi: number | null;
  smoker_current: boolean | null;
  physically_active: boolean | null;
  told_high_chol: boolean | null;
}

function detectFlag(text: string, positivePattern: RegExp, negationPattern: RegExp): boolean | null {
  if (!positivePattern.test(text)) return null;
  return negationPattern.test(text) ? false : true;
}

/**
 * Extracts structured vitals from a Hindi/Hinglish/English speech transcript.
 * Best-effort keyword/regex matching intended for offline ASHA-worker dictation, not NLU-grade parsing.
 */
export function extractVitalsFromSpeech(transcript: string): ParsedVitals {
  const rawText = transcript.toLowerCase();
  const text = normalizeWordNumbers(rawText);

  // Extract Age
  const ageMatch =
    text.match(/(?:age|umar|saal|साल|उम्र)[\s:]*(\d+)/) || text.match(/(\d+)\s*(?:saal|years|age|साल)/);

  // Extract Gender
  let sex: "male" | "female" | null = null;
  if (rawText.match(/female|aurat|mahila|ladki|महिला|फीमेल|औरत|लड़की/)) sex = "female";
  else if (rawText.match(/male|aadmi|mard|ladka|आदमी|मेल|मर्द|लड़का/)) sex = "male";

  // Extract BMI (spoken as "bmi 28" / "बीएमआई 28")
  const bmiMatch = text.match(/(?:bmi|बीएमआई)[\s:]*(\d{1,2}(?:\.\d{1,2})?)/);

  const negation = /\b(no|nahi|nahin|नहीं|na)\b/;

  const smokerCurrent = detectFlag(
    rawText,
    /smoke|cigarette|sigret|dhoomrapan|धूम्रपान|स्मोक|सिगरेट/,
    negation
  );
  const physicallyActive = detectFlag(
    rawText,
    /active|exercise|vyayam|walk daily|व्यायाम|एक्टिव|कसरत/,
    negation
  );
  const toldHighChol = detectFlag(rawText, /cholesterol|kolestrol|कोलेस्ट्रॉल/, negation);

  return {
    age_years: ageMatch ? parseInt(ageMatch[1], 10) : null,
    sex,
    bmi: bmiMatch ? parseFloat(bmiMatch[1]) : null,
    smoker_current: smokerCurrent,
    physically_active: physicallyActive,
    told_high_chol: toldHighChol,
  };
}
