import fs from "fs";
import path from "path";

interface ModelArtifact {
  target: string;
  feature_names: string[];
  w: number[];
  b: number;
  impute_median: number[];
  risk_bands?: { band: string; min: number; max_exclusive: number }[];
}

function loadModel(fileName: string): ModelArtifact {
  const raw = fs.readFileSync(path.join(__dirname, "models", fileName), "utf-8");
  return JSON.parse(raw);
}

const MODELS = {
  diabetes: loadModel("diabetes_lr.json"),
  hypertension: loadModel("hypertension_lr.json"),
  cvd: loadModel("cvd_lr.json"),
} as const;

function calculateRiskScore(input: Record<string, number | undefined | null>, model: ModelArtifact): number {
  const { w, b, feature_names, impute_median } = model;
  let totalScore = b;

  for (let i = 0; i < feature_names.length; i++) {
    const raw = input[feature_names[i]];
    const value = raw === undefined || raw === null || Number.isNaN(Number(raw)) ? impute_median[i] : Number(raw);
    totalScore += w[i] * value;
  }

  return 1 / (1 + Math.exp(-totalScore));
}

function getRiskBand(probability: number, model: ModelArtifact): string {
  const bands = model.risk_bands?.length
    ? model.risk_bands
    : [
        { band: "low", min: 0, max_exclusive: 0.1 },
        { band: "moderate", min: 0.1, max_exclusive: 0.25 },
        { band: "high", min: 0.25, max_exclusive: 1.01 },
      ];

  for (const band of bands) {
    if (probability >= band.min && probability < band.max_exclusive) return band.band;
  }
  return "high";
}

export interface DiseaseRiskInput {
  age_years?: number;
  sex_female?: number;
  bmi?: number;
  smoker_ever?: number;
  smoker_current?: number;
  alcohol_heavy?: number;
  physically_active?: number;
  gen_health?: number;
  phys_health_days?: number;
  ment_health_days?: number;
  diff_walking?: number;
  told_high_chol?: number;
  kidney_disease?: number;
  stroke_history?: number;
  has_healthplan?: number;
  education?: number;
  income?: number;
  [key: string]: number | undefined;
}

export interface DiseaseRiskResult {
  diabetes: { probability: number; band: string };
  hypertension: { probability: number; band: string };
  cvd: { probability: number; band: string };
}

export function calculateDiseaseRisk(input: DiseaseRiskInput): DiseaseRiskResult {
  const result = {} as DiseaseRiskResult;
  for (const key of Object.keys(MODELS) as (keyof typeof MODELS)[]) {
    const model = MODELS[key];
    const probability = calculateRiskScore(input, model);
    result[key] = { probability: Math.round(probability * 1000) / 1000, band: getRiskBand(probability, model) };
  }
  return result;
}
