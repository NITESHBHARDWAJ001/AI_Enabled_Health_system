import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Save, Stethoscope, Pill, Plus, Trash2, CheckCircle2, FlaskConical, ShieldAlert } from "lucide-react";
import * as consultationsApi from "@/api/consultations";
import * as diagnosesApi from "@/api/diagnoses";
import * as prescriptionsApi from "@/api/prescriptions";
import * as appointmentsApi from "@/api/appointments";
import * as aiApi from "@/api/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import type { PrescriptionItem } from "@/types";

interface StructuredSymptoms {
  chief_complaint: string;
  symptoms: { name: string; duration: string | null; severity: number | null }[];
  associated_symptoms: string[];
  medical_history: string[];
  medications: string[];
  missing_information: string[];
}

export default function ConsultationRoom() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const consultationQuery = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => consultationsApi.getConsultation(consultationId!),
    enabled: !!consultationId,
  });

  const consultation = consultationQuery.data;

  const [symptomsText, setSymptomsText] = useState("");
  const [observations, setObservations] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StructuredSymptoms | null>(null);

  const [diagnosisForm, setDiagnosisForm] = useState({
    conditionName: "",
    description: "",
    isContagious: false,
    contagionCategory: "Influenza",
  });
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);

  const [items, setItems] = useState<Omit<PrescriptionItem, "id">[]>([
    { medicineName: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (consultation) {
      const s = consultation.symptoms as { notes?: string } | null;
      setSymptomsText(s?.notes ?? "");
      setObservations(consultation.observations ?? "");
      if (analysis === null && consultation.aiSummary) {
        try {
          setAnalysis(JSON.parse(consultation.aiSummary));
        } catch {
          // aiSummary wasn't structured JSON — ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultation?.id]);

  async function handleSaveNotes() {
    if (!consultationId) return;
    setSavingNotes(true);
    try {
      await consultationsApi.updateConsultation(consultationId, {
        symptoms: { notes: symptomsText },
        observations,
      });
      toast({ title: "Notes saved", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't save notes", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleAnalyze() {
    if (!consultation || !symptomsText.trim()) return;
    setAnalyzing(true);
    try {
      const result = await aiApi.runSymptomAnalysis({ patientId: consultation.patientId, freeText: symptomsText });
      setAnalysis(result.output);
      await consultationsApi.updateConsultation(consultationId!, { aiSummary: JSON.stringify(result.output) });
      toast({ title: "AI analysis ready", description: "Review before acting on it.", variant: "success" });
    } catch (err) {
      toast({ title: "AI analysis failed", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setAnalyzing(false);
    }
  }

  function applyAiSuggestion() {
    if (!analysis) return;
    setDiagnosisForm((prev) => ({ ...prev, conditionName: analysis.chief_complaint, description: "" }));
  }

  async function handleCreateDiagnosis(e: React.FormEvent, aiSuggested: boolean) {
    e.preventDefault();
    if (!consultationId) return;
    setSavingDiagnosis(true);
    try {
      await diagnosesApi.createDiagnosis({
        consultationId,
        conditionName: diagnosisForm.conditionName,
        description: diagnosisForm.description,
        aiSuggested,
        isContagious: diagnosisForm.isContagious,
        contagionCategory: diagnosisForm.isContagious ? diagnosisForm.contagionCategory : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] });
      toast({
        title: "Diagnosis recorded",
        description: diagnosisForm.isContagious ? "Nearby patients will be notified of a possible health risk." : undefined,
        variant: "success",
      });
    } catch (err) {
      toast({ title: "Couldn't save diagnosis", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setSavingDiagnosis(false);
    }
  }

  function updateItem(index: number, patch: Partial<Omit<PrescriptionItem, "id">>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleCreatePrescription(e: React.FormEvent) {
    e.preventDefault();
    if (!consultationId) return;
    const validItems = items.filter((i) => i.medicineName.trim());
    if (validItems.length === 0) {
      toast({ title: "Add at least one medicine", variant: "error" });
      return;
    }
    setSavingPrescription(true);
    try {
      await prescriptionsApi.createPrescription({ consultationId, notes: prescriptionNotes, items: validItems });
      await queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] });
      toast({ title: "Prescription saved", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't save prescription", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setSavingPrescription(false);
    }
  }

  async function handleEndConsultation() {
    if (!consultation) return;
    setEnding(true);
    try {
      await consultationsApi.updateConsultation(consultation.id, { endConsultation: true });
      await appointmentsApi.updateAppointmentStatus(consultation.appointmentId, "COMPLETED");
      toast({ title: "Consultation completed", variant: "success" });
      navigate("/doctor/dashboard");
    } catch (err) {
      toast({ title: "Couldn't end consultation", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setEnding(false);
    }
  }

  if (consultationQuery.isLoading || !consultation) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const isEnded = !!consultation.endedAt;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/doctor/dashboard" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" /> Back to queue
            </Link>
            <h1 className="mt-2 font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
              Consultation · {consultation.patient?.fullName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isEnded ? (
              <Badge variant="neutral">Completed</Badge>
            ) : (
              <Button variant="outline" onClick={handleEndConsultation} disabled={ending}>
                {ending ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                End consultation
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-brand-600" /> Symptoms &amp; observations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Patient-reported symptoms</Label>
                  <Textarea rows={4} value={symptomsText} onChange={(e) => setSymptomsText(e.target.value)} disabled={isEnded} />
                </div>
                <div className="space-y-1.5">
                  <Label>Clinical observations</Label>
                  <Textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} disabled={isEnded} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes || isEnded}>
                    {savingNotes ? <Spinner /> : <Save className="h-3.5 w-3.5" />}
                    Save notes
                  </Button>
                  <Button size="sm" variant="accent" onClick={handleAnalyze} disabled={analyzing || !symptomsText.trim() || isEnded}>
                    {analyzing ? <Spinner /> : <Sparkles className="h-3.5 w-3.5" />}
                    Run AI symptom analysis
                  </Button>
                </div>

                {analysis && (
                  <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 dark:border-accent-900 dark:bg-accent-900/10">
                    <div className="mb-2 flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-accent-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                        AI-suggested structure — not a diagnosis
                      </p>
                    </div>
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-100">{analysis.chief_complaint}</p>
                    {analysis.symptoms?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-surface-600 dark:text-surface-300">
                        {analysis.symptoms.map((s, i) => (
                          <li key={i}>
                            • {s.name} {s.duration ? `(${s.duration})` : ""} {s.severity ? `— severity ${s.severity}/10` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {analysis.missing_information?.length > 0 && (
                      <p className="mt-2 text-xs text-surface-500">
                        Consider asking about: {analysis.missing_information.join(", ")}
                      </p>
                    )}
                    <Button size="sm" variant="outline" className="mt-3" onClick={applyAiSuggestion} disabled={isEnded}>
                      Use as diagnosis draft
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                {consultation.diagnosis ? (
                  <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{consultation.diagnosis.conditionName}</p>
                      {consultation.diagnosis.aiSuggested && <Badge variant="accent">AI-assisted</Badge>}
                      <Badge variant="success">Doctor-confirmed</Badge>
                      {consultation.diagnosis.isContagious && (
                        <Badge variant="danger">
                          <ShieldAlert className="h-3 w-3" /> Contagious · {consultation.diagnosis.contagionCategory}
                        </Badge>
                      )}
                    </div>
                    {consultation.diagnosis.description && (
                      <p className="mt-1 text-sm text-surface-500">{consultation.diagnosis.description}</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={(e) => handleCreateDiagnosis(e, !!analysis)} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Condition</Label>
                      <Input
                        required
                        value={diagnosisForm.conditionName}
                        onChange={(e) => setDiagnosisForm({ ...diagnosisForm, conditionName: e.target.value })}
                        disabled={isEnded}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Textarea
                        rows={2}
                        value={diagnosisForm.description}
                        onChange={(e) => setDiagnosisForm({ ...diagnosisForm, description: e.target.value })}
                        disabled={isEnded}
                      />
                    </div>

                    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={diagnosisForm.isContagious}
                          onChange={(e) => setDiagnosisForm({ ...diagnosisForm, isContagious: e.target.checked })}
                          disabled={isEnded}
                          className="h-4 w-4 rounded border-surface-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-300">
                          <ShieldAlert className="h-4 w-4" /> Contagious / Infectious
                        </span>
                      </label>
                      {diagnosisForm.isContagious && (
                        <div className="mt-3 space-y-1.5">
                          <Label>Category</Label>
                          <Select
                            value={diagnosisForm.contagionCategory}
                            onChange={(e) => setDiagnosisForm({ ...diagnosisForm, contagionCategory: e.target.value })}
                            disabled={isEnded}
                          >
                            <option value="Influenza">Influenza</option>
                            <option value="COVID-like illness">COVID-like illness</option>
                            <option value="Chickenpox">Chickenpox</option>
                            <option value="Measles">Measles</option>
                            <option value="Gastroenteritis">Gastroenteritis</option>
                            <option value="Other">Other</option>
                          </Select>
                          <p className="text-xs text-red-600/80 dark:text-red-400/80">
                            Patients who've shared their location within 5km of this hospital will get a non-identifying
                            health alert.
                          </p>
                        </div>
                      )}
                    </div>

                    <Button type="submit" size="sm" disabled={savingDiagnosis || isEnded}>
                      {savingDiagnosis && <Spinner />}
                      Confirm diagnosis
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-purple-600" /> Prescription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consultation.prescription ? (
                  <div className="space-y-2">
                    {consultation.prescription.items.map((item) => (
                      <div key={item.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                        <p className="text-sm font-semibold">{item.medicineName}</p>
                        <p className="text-xs text-surface-500">
                          {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ")}
                        </p>
                        {item.instructions && <p className="mt-1 text-xs text-surface-400">{item.instructions}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleCreatePrescription} className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-surface-200 dark:border-surface-800 p-3 sm:grid-cols-5">
                        <Input
                          placeholder="Medicine"
                          className="sm:col-span-2"
                          value={item.medicineName ?? ""}
                          onChange={(e) => updateItem(i, { medicineName: e.target.value })}
                          disabled={isEnded}
                        />
                        <Input placeholder="Dosage" value={item.dosage ?? ""} onChange={(e) => updateItem(i, { dosage: e.target.value })} disabled={isEnded} />
                        <Input
                          placeholder="Frequency"
                          value={item.frequency ?? ""}
                          onChange={(e) => updateItem(i, { frequency: e.target.value })}
                          disabled={isEnded}
                        />
                        <div className="flex gap-2">
                          <Input placeholder="Duration" value={item.duration ?? ""} onChange={(e) => updateItem(i, { duration: e.target.value })} disabled={isEnded} />
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                              className="shrink-0 rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setItems((prev) => [...prev, { medicineName: "", dosage: "", frequency: "", duration: "", instructions: "" }])}
                      disabled={isEnded}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add medicine
                    </Button>
                    <div className="space-y-1.5">
                      <Label>Additional notes</Label>
                      <Textarea rows={2} value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} disabled={isEnded} />
                    </div>
                    <Button type="submit" size="sm" disabled={savingPrescription || isEnded}>
                      {savingPrescription && <Spinner />}
                      Save prescription
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="flex h-[calc(100vh-8rem)] flex-col xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-500" /> Doctor AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ChatPanel
                type="DOCTOR_ASSISTANT"
                patientId={consultation.patientId}
                className="h-full"
                emptyStateHint="Ask for a history summary, missing info, or help drafting notes."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
