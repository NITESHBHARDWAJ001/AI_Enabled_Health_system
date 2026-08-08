import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import * as infectionAlertsApi from "@/api/infectionAlerts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/formatters";
import type { HospitalAdminProfile } from "@/types";

export default function AdminAlerts() {
  const user = useAuthStore((s) => s.user);
  const admin = user?.profile as HospitalAdminProfile;

  const { data, isLoading } = useQuery({
    queryKey: ["infection-alerts", admin?.hospitalId],
    queryFn: () => infectionAlertsApi.listInfectionAlerts(admin!.hospitalId),
    enabled: !!admin?.hospitalId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">Infection Alerts</h1>
        <p className="mt-1 text-sm text-surface-500">
          Contagious diagnoses flagged by your doctors, and how many nearby patients were notified.
        </p>
      </div>

      <Card>
        <CardContent className="divide-y divide-surface-200 dark:divide-surface-800 p-0">
          {isLoading && (
            <div className="flex justify-center p-8">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="p-8 text-center text-sm text-surface-400">No infection alerts have been triggered yet.</p>
          )}
          {(data ?? []).map((alert) => (
            <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{alert.category}</p>
                  <p className="text-xs text-surface-500">{formatDateTime(alert.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{alert.radiusKm} km radius</Badge>
                <Badge variant={alert.notifiedCount > 0 ? "warning" : "neutral"}>
                  <Users className="h-3 w-3" /> {alert.notifiedCount} notified
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
