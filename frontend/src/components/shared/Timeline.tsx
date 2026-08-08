import { motion } from "framer-motion";
import {
  CalendarClock,
  Stethoscope,
  ClipboardList,
  Pill,
  FileText,
  Activity,
  HeartPulse,
} from "lucide-react";
import type { TimelineEntry } from "@/types";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const TYPE_META: Record<
  TimelineEntry["type"],
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  APPOINTMENT: { icon: CalendarClock, color: "bg-brand-500", label: "Appointment" },
  CONSULTATION: { icon: Stethoscope, color: "bg-teal-500", label: "Consultation" },
  DIAGNOSIS: { icon: ClipboardList, color: "bg-accent-500", label: "Diagnosis" },
  PRESCRIPTION: { icon: Pill, color: "bg-purple-500", label: "Prescription" },
  DOCUMENT: { icon: FileText, color: "bg-cyan-500", label: "Document" },
  VITAL: { icon: Activity, color: "bg-rose-500", label: "Vital" },
  CONDITION: { icon: HeartPulse, color: "bg-orange-500", label: "Condition" },
};

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
        <Activity className="h-8 w-8 text-surface-300" />
        <p className="text-sm text-surface-500">No medical history recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-surface-200 dark:bg-surface-800" />
      <div className="space-y-5">
        {entries.map((entry, i) => {
          const meta = TYPE_META[entry.type];
          const Icon = meta.icon;
          return (
            <motion.div
              key={entry.id + entry.type}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="relative"
            >
              <div
                className={cn(
                  "absolute -left-8 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-[var(--shadow-soft)]",
                  meta.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="card-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{entry.title}</p>
                  <Badge variant="neutral">{formatDate(entry.date)}</Badge>
                </div>
                {entry.summary && <p className="mt-1 text-sm text-surface-500">{entry.summary}</p>}
                {entry.type === "DIAGNOSIS" && (entry.meta as any)?.aiSuggested && (
                  <Badge variant="accent" className="mt-2">
                    AI-assisted, doctor-confirmed
                  </Badge>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
