import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stethoscope, Clock, User, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import * as appointmentsApi from "@/api/appointments";
import * as consultationsApi from "@/api/consultations";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/formatters";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import type { DoctorProfile } from "@/types";

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);
  const doctor = user?.profile as DoctorProfile;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [startingId, setStartingId] = useState<string | null>(null);

  const appointmentsQuery = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: () => appointmentsApi.listAppointments(),
  });

  const appointments = (appointmentsQuery.data ?? []).slice().sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const today = new Date().toDateString();
  const todayAppointments = appointments.filter((a) => new Date(a.scheduledAt).toDateString() === today);
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;

  async function handleEnterConsultation(appointmentId: string, existingConsultationId?: string) {
    if (existingConsultationId) {
      navigate(`/doctor/consultations/${existingConsultationId}`);
      return;
    }
    setStartingId(appointmentId);
    try {
      const consultation = await consultationsApi.createConsultation({ appointmentId });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      navigate(`/doctor/consultations/${consultation.id}`);
    } catch (err) {
      toast({ title: "Couldn't start consultation", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
          Good to see you, Dr. {doctor?.fullName?.split(" ").slice(-1)[0]}
        </h1>
        <p className="mt-1 text-sm text-surface-500">{doctor?.specialty} · Today's queue</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today's appointments" value={todayAppointments.length} icon={Clock} accent="brand" />
        <StatCard label="Pending confirmation" value={pendingCount} icon={Stethoscope} accent="accent" />
        <StatCard label="Total upcoming" value={appointments.length} icon={User} accent="neutral" />
      </div>

      <Card>
        <CardContent className="divide-y divide-surface-200 dark:divide-surface-800 p-0">
          {appointmentsQuery.isLoading && (
            <div className="flex justify-center p-8">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {!appointmentsQuery.isLoading && appointments.length === 0 && (
            <p className="p-8 text-center text-sm text-surface-400">No appointments scheduled.</p>
          )}
          {appointments.map((appt) => (
            <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={appt.patient?.fullName ?? "Patient"} size={9} />
                <div>
                  <button
                    onClick={() => navigate(`/doctor/patients/${appt.patientId}`)}
                    className="text-sm font-semibold text-surface-900 hover:underline dark:text-surface-50"
                  >
                    {appt.patient?.fullName}
                  </button>
                  <p className="text-xs text-surface-500">{formatDateTime(appt.scheduledAt)}</p>
                  {appt.reason && <p className="text-xs text-surface-400">{appt.reason}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={appt.status === "COMPLETED" ? "neutral" : appt.status === "CANCELLED" ? "danger" : "success"}>
                  {appt.status}
                </Badge>
                {appt.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    variant={appt.consultation ? "outline" : "default"}
                    disabled={startingId === appt.id}
                    onClick={() => handleEnterConsultation(appt.id, appt.consultation?.id)}
                  >
                    {startingId === appt.id ? <Spinner /> : <ArrowRight className="h-3.5 w-3.5" />}
                    {appt.consultation ? "Continue" : "Start consultation"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
