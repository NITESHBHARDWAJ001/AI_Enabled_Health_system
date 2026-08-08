import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Stethoscope, Building2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import * as appointmentsApi from "@/api/appointments";
import * as hospitalsApi from "@/api/hospitals";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/formatters";
import type { HospitalAdminProfile } from "@/types";

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const admin = user?.profile as HospitalAdminProfile;

  const hospitalQuery = useQuery({
    queryKey: ["hospital", admin?.hospitalId],
    queryFn: () => hospitalsApi.getHospital(admin!.hospitalId),
    enabled: !!admin?.hospitalId,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => appointmentsApi.listAppointments(),
  });

  const appointments = appointmentsQuery.data ?? [];
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const pending = appointments.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
          {hospitalQuery.data?.name ?? "Hospital"} Overview
        </h1>
        <p className="mt-1 text-sm text-surface-500">{hospitalQuery.data?.city}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Doctors" value={hospitalQuery.data?.doctors?.length ?? 0} icon={Stethoscope} accent="brand" />
        <StatCard label="Departments" value={hospitalQuery.data?.departments?.length ?? 0} icon={Building2} accent="neutral" />
        <StatCard label="Pending appointments" value={pending} icon={CalendarClock} accent="accent" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} accent="brand" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent appointments</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-surface-200 dark:divide-surface-800 p-0">
          {appointmentsQuery.isLoading && (
            <div className="flex justify-center p-8">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {!appointmentsQuery.isLoading && appointments.length === 0 && (
            <p className="p-8 text-center text-sm text-surface-400">No appointments yet.</p>
          )}
          {appointments.slice(0, 10).map((appt) => (
            <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="text-sm font-medium">
                  {appt.patient?.fullName} <span className="font-normal text-surface-400">with Dr. {appt.doctor?.fullName}</span>
                </p>
                <p className="text-xs text-surface-500">{formatDateTime(appt.scheduledAt)}</p>
              </div>
              <Badge variant={appt.status === "COMPLETED" ? "neutral" : appt.status === "CANCELLED" ? "danger" : "success"}>
                {appt.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
