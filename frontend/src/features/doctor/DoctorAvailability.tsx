import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import * as doctorsApi from "@/api/doctors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import type { DoctorProfile } from "@/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DayRow {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function defaultRows(): DayRow[] {
  return DAYS.map((_, i) => ({ enabled: i >= 1 && i <= 5, start: "09:00", end: "17:00" }));
}

export default function DoctorAvailability() {
  const user = useAuthStore((s) => s.user);
  const doctor = user?.profile as DoctorProfile;
  const [rows, setRows] = useState<DayRow[]>(defaultRows());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-availability", doctor?.id],
    queryFn: () => doctorsApi.getAvailability(doctor!.id),
    enabled: !!doctor?.id,
  });

  useEffect(() => {
    if (data && !loaded) {
      const next = defaultRows().map((r) => ({ ...r, enabled: false }));
      for (const window of data) {
        next[window.dayOfWeek] = {
          enabled: true,
          start: minutesToTime(window.startMinutes),
          end: minutesToTime(window.endMinutes),
        };
      }
      setRows(next);
      setLoaded(true);
    }
  }, [data, loaded]);

  function updateRow(index: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    if (!doctor?.id) return;
    const windows = rows
      .map((row, dayOfWeek) => ({ row, dayOfWeek }))
      .filter(({ row }) => row.enabled)
      .map(({ row, dayOfWeek }) => ({
        dayOfWeek,
        startMinutes: timeToMinutes(row.start),
        endMinutes: timeToMinutes(row.end),
      }));

    const invalid = windows.find((w) => w.endMinutes <= w.startMinutes);
    if (invalid) {
      toast({ title: "Check your hours", description: "End time must be after start time.", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      await doctorsApi.setAvailability(doctor.id, windows);
      toast({ title: "Availability updated", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't save availability", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">Weekly Availability</h1>
        <p className="mt-1 text-sm text-surface-500">
          Set your working hours — patients can only book 30-minute slots inside these windows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-600" /> Working hours
          </CardTitle>
          <CardDescription>Toggle a day on to accept appointments, and set your start/end time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={DAYS[i]}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-200 dark:border-surface-800 p-3"
            >
              <label className="flex w-32 shrink-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateRow(i, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium">{DAYS[i]}</span>
              </label>
              <input
                type="time"
                value={row.start}
                disabled={!row.enabled}
                onChange={(e) => updateRow(i, { start: e.target.value })}
                className="h-9 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-2.5 text-sm disabled:opacity-40"
              />
              <span className="text-sm text-surface-400">to</span>
              <input
                type="time"
                value={row.end}
                disabled={!row.enabled}
                onChange={(e) => updateRow(i, { end: e.target.value })}
                className="h-9 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-2.5 text-sm disabled:opacity-40"
              />
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? <Spinner /> : <Save className="h-4 w-4" />}
            Save availability
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
