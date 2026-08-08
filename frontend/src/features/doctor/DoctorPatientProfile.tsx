import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Droplet, AlertTriangle } from "lucide-react";
import * as patientsApi from "@/api/patients";
import * as historyApi from "@/api/medicalHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Timeline } from "@/components/shared/Timeline";
import { formatDate } from "@/lib/formatters";

export default function DoctorPatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();

  const patientQuery = useQuery({
    queryKey: ["doctor-view-patient", patientId],
    queryFn: () => patientsApi.getPatient(patientId!),
    enabled: !!patientId,
  });

  const timelineQuery = useQuery({
    queryKey: ["doctor-view-timeline", patientId],
    queryFn: () => historyApi.getTimeline(patientId!),
    enabled: !!patientId,
  });

  if (patientQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const patient = patientQuery.data;
  if (!patient) return null;

  return (
    <div className="space-y-6">
      <Link to="/doctor/dashboard" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={patient.fullName} size={16} />
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">{patient.fullName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-surface-500">
            {patient.dob && <span>{formatDate(patient.dob)}</span>}
            {patient.gender && <span className="capitalize">{patient.gender.toLowerCase()}</span>}
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {patient.phone}
              </span>
            )}
            {patient.bloodGroup && (
              <span className="flex items-center gap-1">
                <Droplet className="h-3.5 w-3.5" /> {patient.bloodGroup}
              </span>
            )}
          </div>
        </div>
      </div>

      {patient.allergies.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Allergies: {patient.allergies.join(", ")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold">Medical Timeline</h2>
          {timelineQuery.isLoading ? <Spinner className="h-5 w-5" /> : <Timeline entries={timelineQuery.data?.timeline ?? []} />}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ongoing conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patient.conditions.length === 0 && <p className="text-sm text-surface-400">None recorded.</p>}
              {patient.conditions.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2">
                  <span className="text-sm">{c.name}</span>
                  <Badge variant={c.status === "ACTIVE" ? "warning" : c.status === "MANAGED" ? "success" : "neutral"}>{c.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patient.vitals.length === 0 && <p className="text-sm text-surface-400">None recorded.</p>}
              {patient.vitals.slice(0, 6).map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-surface-500">{v.type.replace(/_/g, " ")}</span>
                  <span className="font-medium">
                    {v.value} {v.unit}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
