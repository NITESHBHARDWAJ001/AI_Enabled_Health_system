import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import * as historyApi from "@/api/medicalHistory";
import { Timeline } from "@/components/shared/Timeline";
import { Skeleton } from "@/components/ui/skeleton";
import type { PatientProfile } from "@/types";

export default function PatientTimeline() {
  const user = useAuthStore((s) => s.user);
  const patient = user?.profile as PatientProfile;

  const { data, isLoading } = useQuery({
    queryKey: ["patient-timeline-full", patient?.id],
    queryFn: () => historyApi.getTimeline(patient!.id),
    enabled: !!patient?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">Medical Timeline</h1>
        <p className="mt-1 text-sm text-surface-500">Every appointment, diagnosis, prescription and document, in one place.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <Timeline entries={data?.timeline ?? []} />
      )}
    </div>
  );
}
