import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarClock, HeartPulse, FileStack, Stethoscope } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useAuthStore } from "@/store/authStore";
import * as historyApi from "@/api/medicalHistory";
import * as patientsApi from "@/api/patients";
import { StatCard } from "@/components/shared/StatCard";
import { Timeline } from "@/components/shared/Timeline";
import { PatientChatWidget } from "@/components/shared/PatientChatWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/formatters";
import type { PatientProfile } from "@/types";

export default function PatientDashboard() {
  const user = useAuthStore((s) => s.user);
  const patient = user?.profile as PatientProfile;
  const patientId = patient?.id;

  const summaryQuery = useQuery({
    queryKey: ["patient-summary", patientId],
    queryFn: () => historyApi.getSummary(patientId!),
    enabled: !!patientId,
  });

  const timelineQuery = useQuery({
    queryKey: ["patient-timeline", patientId],
    queryFn: () => historyApi.getTimeline(patientId!),
    enabled: !!patientId,
  });

  const vitalsQuery = useQuery({
    queryKey: ["patient-vitals", patientId],
    queryFn: () => patientsApi.listVitals(patientId!),
    enabled: !!patientId,
  });

  const firstName = patient?.fullName?.split(" ")[0] ?? "there";
  const chartData = (vitalsQuery.data ?? [])
    .filter((v) => v.type === "HEART_RATE" || v.type === "GLUCOSE")
    .slice(0, 10)
    .reverse()
    .map((v) => ({ name: new Date(v.recordedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), value: v.value, type: v.type }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
          Good to see you, {firstName}
        </h1>
        <p className="mt-1 text-sm text-surface-500">Here's your health overview.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Upcoming appointment"
          value={
            summaryQuery.data?.upcomingAppointment
              ? formatDateTime(summaryQuery.data.upcomingAppointment.scheduledAt)
              : "None scheduled"
          }
          icon={CalendarClock}
          accent="brand"
          hint={summaryQuery.data?.upcomingAppointment ? `Dr. ${summaryQuery.data.upcomingAppointment.doctor.fullName}` : undefined}
        />
        <StatCard label="Active conditions" value={summaryQuery.data?.conditionsCount ?? 0} icon={HeartPulse} accent="accent" />
        <StatCard label="Documents on file" value={summaryQuery.data?.documentsCount ?? 0} icon={FileStack} accent="neutral" />
        <StatCard label="Blood group" value={patient?.bloodGroup ?? "—"} icon={Stethoscope} accent="brand" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <Timeline entries={(timelineQuery.data?.timeline ?? []).slice(0, 5)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vitals trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-surface-400)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-surface-400)" width={30} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-brand-600)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-surface-400">No vitals recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {patientId && <PatientChatWidget patientId={patientId} />}
    </div>
  );
}
