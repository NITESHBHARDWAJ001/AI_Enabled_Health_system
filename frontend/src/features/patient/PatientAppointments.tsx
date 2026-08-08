import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Clock, XCircle } from "lucide-react";
import * as appointmentsApi from "@/api/appointments";
import * as doctorsApi from "@/api/doctors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, formatTime } from "@/lib/formatters";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/cn";
import type { AppointmentStatus } from "@/types";

const STATUS_VARIANT: Record<AppointmentStatus, "warning" | "success" | "neutral" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientAppointments() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: () => appointmentsApi.listAppointments(),
  });

  const doctorsQuery = useQuery({ queryKey: ["doctors-list"], queryFn: () => doctorsApi.listDoctors() });

  const slotsQuery = useQuery({
    queryKey: ["available-slots", doctorId, date],
    queryFn: () => doctorsApi.getAvailableSlots(doctorId, date),
    enabled: !!doctorId && !!date,
  });

  function resetForm() {
    setDoctorId("");
    setDate(todayStr());
    setScheduledAt(null);
    setReason("");
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) {
      toast({ title: "Pick a time slot", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await appointmentsApi.createAppointment({
        doctorId,
        scheduledAt,
        reason: reason || undefined,
      });
      toast({ title: "Appointment booked", variant: "success" });
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (err) {
      toast({ title: "Couldn't book appointment", description: extractErrorMessage(err), variant: "error" });
      queryClient.invalidateQueries({ queryKey: ["available-slots", doctorId, date] });
      setScheduledAt(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    try {
      await appointmentsApi.updateAppointmentStatus(id, "CANCELLED");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (err) {
      toast({ title: "Couldn't cancel", description: extractErrorMessage(err), variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">Appointments</h1>
          <p className="mt-1 text-sm text-surface-500">Book, track, and manage your visits.</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus className="h-4 w-4" />
              Book appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book an appointment</DialogTitle>
              <DialogDescription>Pick a doctor, a date, then an open slot.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Doctor</Label>
                <Select
                  required
                  value={doctorId}
                  onChange={(e) => {
                    setDoctorId(e.target.value);
                    setScheduledAt(null);
                  }}
                >
                  <option value="">Select a doctor</option>
                  {(doctorsQuery.data ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.fullName} — {d.specialty}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  required
                  min={todayStr()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setScheduledAt(null);
                  }}
                />
              </div>

              {doctorId && (
                <div className="space-y-1.5">
                  <Label>Available slots</Label>
                  {slotsQuery.isLoading && <Spinner className="h-4 w-4" />}
                  {!slotsQuery.isLoading && (slotsQuery.data ?? []).length === 0 && (
                    <p className="text-sm text-surface-400">No open slots on this date — try another day.</p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {(slotsQuery.data ?? []).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setScheduledAt(slot)}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                          scheduledAt === slot
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-surface-300 dark:border-surface-700 hover:border-brand-400"
                        )}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Reason for visit</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe why you're visiting" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !scheduledAt}>
                {submitting && <Spinner />}
                Confirm booking
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {appointmentsQuery.isLoading && <Spinner className="h-6 w-6" />}
        {!appointmentsQuery.isLoading && (appointmentsQuery.data ?? []).length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-surface-400">No appointments yet.</CardContent>
          </Card>
        )}
        {(appointmentsQuery.data ?? []).map((appt) => (
          <Card key={appt.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                  Dr. {appt.doctor?.fullName} <span className="font-normal text-surface-400">· {appt.doctor?.specialty}</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-surface-500">
                  <Clock className="h-3.5 w-3.5" /> {formatDateTime(appt.scheduledAt)}
                </p>
                {appt.reason && <p className="mt-1 text-xs text-surface-400">{appt.reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge>
                {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(appt.id)}>
                    <XCircle className="h-3.5 w-3.5" /> Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
