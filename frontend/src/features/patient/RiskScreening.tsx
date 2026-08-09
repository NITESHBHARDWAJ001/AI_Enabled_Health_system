import { useState } from "react";
import { Activity, Mic, MicOff, Save, AlertTriangle, WifiOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { calculateRiskScore, getRiskBand, type ModelArtifact } from "@/lib/riskEngine";
import { useVoiceVitals } from "@/hooks/useVoiceVitals";
import { queueScreening } from "@/lib/offlineDb";
import * as aiApi from "@/api/ai";
import type { ScreeningResult } from "@/api/ai";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { OCRScanner } from "@/components/shared/OCRScanner";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import type { PatientProfile } from "@/types";

import diabetesModel from "@/assets/models/diabetes_lr.json";
import hypertensionModel from "@/assets/models/hypertension_lr.json";
import cvdModel from "@/assets/models/cvd_lr.json";

interface FormState {
  age_years: string;
  sex_female: string;
  bmi: string;
  smoker_ever: boolean;
  smoker_current: boolean;
  alcohol_heavy: boolean;
  physically_active: boolean;
  gen_health: string;
  phys_health_days: string;
  ment_health_days: string;
  diff_walking: boolean;
  told_high_chol: boolean;
  kidney_disease: boolean;
  stroke_history: boolean;
  has_healthplan: boolean;
  education: string;
  income: string;
}

const emptyForm: FormState = {
  age_years: "",
  sex_female: "",
  bmi: "",
  smoker_ever: false,
  smoker_current: false,
  alcohol_heavy: false,
  physically_active: false,
  gen_health: "",
  phys_health_days: "",
  ment_health_days: "",
  diff_walking: false,
  told_high_chol: false,
  kidney_disease: false,
  stroke_history: false,
  has_healthplan: false,
  education: "",
  income: "",
};

const BAND_STYLE: Record<string, { badge: "success" | "warning" | "danger"; label: string }> = {
  low: { badge: "success", label: "Low risk" },
  moderate: { badge: "warning", label: "Moderate risk" },
  high: { badge: "danger", label: "High risk" },
};

function toNumericInput(form: FormState): Record<string, number> {
  return {
    age_years: Number(form.age_years) || 0,
    sex_female: form.sex_female === "female" ? 1 : 0,
    bmi: Number(form.bmi) || 0,
    smoker_ever: form.smoker_ever ? 1 : 0,
    smoker_current: form.smoker_current ? 1 : 0,
    alcohol_heavy: form.alcohol_heavy ? 1 : 0,
    physically_active: form.physically_active ? 1 : 0,
    gen_health: Number(form.gen_health) || 3,
    phys_health_days: Number(form.phys_health_days) || 0,
    ment_health_days: Number(form.ment_health_days) || 0,
    diff_walking: form.diff_walking ? 1 : 0,
    told_high_chol: form.told_high_chol ? 1 : 0,
    kidney_disease: form.kidney_disease ? 1 : 0,
    stroke_history: form.stroke_history ? 1 : 0,
    has_healthplan: form.has_healthplan ? 1 : 0,
    education: Number(form.education) || 4,
    income: Number(form.income) || 4,
  };
}

function runModels(input: Record<string, number>): ScreeningResult {
  const score = (model: ModelArtifact) => {
    const probability = calculateRiskScore(input, model);
    return { probability: Math.round(probability * 1000) / 1000, band: getRiskBand(probability, model) };
  };
  return {
    diabetes: score(diabetesModel as ModelArtifact),
    hypertension: score(hypertensionModel as ModelArtifact),
    cvd: score(cvdModel as ModelArtifact),
  };
}

export default function RiskScreening() {
  const user = useAuthStore((s) => s.user);
  const patient = user?.profile as PatientProfile;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const voice = useVoiceVitals((vitals) => {
    setForm((prev) => ({
      ...prev,
      age_years: vitals.age_years != null ? String(vitals.age_years) : prev.age_years,
      sex_female: vitals.sex ? vitals.sex : prev.sex_female,
      bmi: vitals.bmi != null ? String(vitals.bmi) : prev.bmi,
      smoker_current: vitals.smoker_current ?? prev.smoker_current,
      physically_active: vitals.physically_active ?? prev.physically_active,
      told_high_chol: vitals.told_high_chol ?? prev.told_high_chol,
    }));
    toast({ title: "Voice input captured", variant: "success" });
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient?.id) return;

    const input = toNumericInput(form);
    const output = runModels(input);
    setResult(output);

    setSaving(true);
    try {
      if (!navigator.onLine) throw new Error("offline");
      await aiApi.submitScreening({ patientId: patient.id, inputSnapshot: input, output });
      toast({ title: "Screening saved", variant: "success" });
    } catch (err) {
      await queueScreening({ patientId: patient.id, inputSnapshot: input, output });
      const offline = !navigator.onLine || (err instanceof Error && err.message === "offline");
      toast({
        title: offline ? "Saved offline" : "Couldn't reach the server",
        description: offline
          ? "You're offline — this screening is queued and will sync automatically once you're back online."
          : `${extractErrorMessage(err)} — queued locally and will retry automatically.`,
        variant: offline ? "default" : "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            Chronic Disease Risk Screening
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Runs entirely on this device — works offline. A screening estimate, not a diagnosis.
          </p>
        </div>
        {voice.supported && (
          <Button
            type="button"
            variant={voice.isListening ? "destructive" : "outline"}
            size="sm"
            onClick={() => (voice.isListening ? voice.stop() : voice.start())}
          >
            {voice.isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {voice.isListening ? "Listening…" : "Dictate in Hindi"}
          </Button>
        )}
      </div>

      {voice.isListening && voice.interimText && (
        <p className="rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-2 text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
          {voice.interimText}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Demographics &amp; body metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Age (years)</Label>
                <Input type="number" min={0} max={120} value={form.age_years} onChange={(e) => set("age_years", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Sex</Label>
                <Select value={form.sex_female} onChange={(e) => set("sex_female", e.target.value)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>BMI</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.1" value={form.bmi} onChange={(e) => set("bmi", e.target.value)} />
                  <OCRScanner label="Scan" onExtract={(v) => set("bmi", String(v))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifestyle</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["smoker_ever", "Ever smoked"],
                  ["smoker_current", "Currently smokes"],
                  ["alcohol_heavy", "Heavy alcohol use"],
                  ["physically_active", "Physically active"],
                ] as [keyof FormState, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-800 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={form[key] as boolean}
                    onChange={(e) => set(key, e.target.checked as FormState[typeof key])}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>General health</Label>
                <Select value={form.gen_health} onChange={(e) => set("gen_health", e.target.value)}>
                  <option value="">Select</option>
                  <option value="1">Excellent</option>
                  <option value="2">Very good</option>
                  <option value="3">Good</option>
                  <option value="4">Fair</option>
                  <option value="5">Poor</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Poor physical health days (last 30)</Label>
                <Input type="number" min={0} max={30} value={form.phys_health_days} onChange={(e) => set("phys_health_days", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Poor mental health days (last 30)</Label>
                <Input type="number" min={0} max={30} value={form.ment_health_days} onChange={(e) => set("ment_health_days", e.target.value)} />
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-800 px-3 py-2.5 sm:col-span-3">
                <input
                  type="checkbox"
                  checked={form.diff_walking}
                  onChange={(e) => set("diff_walking", e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm">Difficulty walking or climbing stairs</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical history &amp; access</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["told_high_chol", "Told high cholesterol"],
                  ["kidney_disease", "Kidney disease"],
                  ["stroke_history", "History of stroke"],
                  ["has_healthplan", "Has health insurance/coverage"],
                ] as [keyof FormState, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-800 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={form[key] as boolean}
                    onChange={(e) => set(key, e.target.checked as FormState[typeof key])}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
              <div className="space-y-1.5">
                <Label>Education level</Label>
                <Select value={form.education} onChange={(e) => set("education", e.target.value)}>
                  <option value="">Select</option>
                  <option value="1">No formal schooling</option>
                  <option value="2">Primary school</option>
                  <option value="3">Some secondary</option>
                  <option value="4">Secondary / high school</option>
                  <option value="5">Some college</option>
                  <option value="6">College graduate or higher</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Household income bracket</Label>
                <Select value={form.income} onChange={(e) => set("income", e.target.value)}>
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                    <option key={v} value={v}>
                      Bracket {v}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : <Save className="h-4 w-4" />}
            Calculate &amp; save screening
          </Button>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-600" /> Results
              </CardTitle>
              <CardDescription>Calculated instantly on this device from an offline model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!result && <p className="text-sm text-surface-400">Fill out the form and calculate to see results.</p>}
              {result &&
                (["diabetes", "hypertension", "cvd"] as const).map((key) => {
                  const r = result[key];
                  const style = BAND_STYLE[r.band] ?? BAND_STYLE.moderate;
                  return (
                    <div key={key} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{key === "cvd" ? "Cardiovascular" : key}</span>
                        <Badge variant={style.badge}>{style.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-surface-400">{Math.round(r.probability * 100)}% estimated probability</p>
                    </div>
                  );
                })}
              {result && Object.values(result).some((r) => r.band === "high") && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  This is a screening estimate, not a diagnosis. Please discuss high-risk results with your doctor soon.
                </div>
              )}
              {!navigator.onLine && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
                  <WifiOff className="h-4 w-4 shrink-0" /> You're offline — saved screenings will sync automatically.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
