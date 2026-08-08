import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, MapPin, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import * as patientsApi from "@/api/patients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import type { PatientProfile as PatientProfileType } from "@/types";

export default function PatientProfile() {
  const user = useAuthStore((s) => s.user);
  const authPatient = user?.profile as PatientProfileType;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["patient-detail", authPatient?.id],
    queryFn: () => patientsApi.getPatient(authPatient!.id),
    enabled: !!authPatient?.id,
  });

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
    gender: "",
    dob: "",
    allergiesText: "",
  });
  const [saving, setSaving] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        fullName: data.fullName ?? "",
        phone: data.phone ?? "",
        bloodGroup: data.bloodGroup ?? "",
        address: data.address ?? "",
        emergencyContact: data.emergencyContact ?? "",
        gender: data.gender ?? "",
        dob: data.dob ? data.dob.slice(0, 10) : "",
        allergiesText: (data.allergies ?? []).join(", "),
      });
    }
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!authPatient?.id) return;
    setSaving(true);
    try {
      await patientsApi.updatePatient(authPatient.id, {
        fullName: form.fullName,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        address: form.address,
        emergencyContact: form.emergencyContact,
        gender: (form.gender || undefined) as any,
        dob: form.dob || undefined,
        allergies: form.allergiesText
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      });
      await queryClient.invalidateQueries({ queryKey: ["patient-detail", authPatient.id] });
      toast({ title: "Profile updated", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't update profile", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function handleShareLocation() {
    if (!authPatient?.id) return;
    if (!("geolocation" in navigator)) {
      toast({ title: "Location not supported", description: "Your browser doesn't support geolocation.", variant: "error" });
      return;
    }
    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await patientsApi.updateLocation(authPatient.id, position.coords.latitude, position.coords.longitude);
          await queryClient.invalidateQueries({ queryKey: ["patient-detail", authPatient.id] });
          toast({ title: "Location shared", description: "You'll now receive nearby health alerts.", variant: "success" });
        } catch (err) {
          toast({ title: "Couldn't save location", description: extractErrorMessage(err), variant: "error" });
        } finally {
          setSharingLocation(false);
        }
      },
      (error) => {
        setSharingLocation(false);
        toast({ title: "Location permission denied", description: error.message, variant: "error" });
      }
    );
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
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">My Profile</h1>
        <p className="mt-1 text-sm text-surface-500">Keep your details accurate — doctors rely on this.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full name</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Blood group</Label>
                <Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} placeholder="O+" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Emergency contact</Label>
                <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Allergies (comma separated)</Label>
                <Input value={form.allergiesText} onChange={(e) => setForm({ ...form, allergiesText: e.target.value })} placeholder="Penicillin, Peanuts" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner /> : <Save className="h-4 w-4" />}
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ongoing conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.conditions ?? []).length === 0 && <p className="text-sm text-surface-400">None recorded.</p>}
            {(data?.conditions ?? []).map((c) => (
              <div key={c.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{c.name}</p>
                  <Badge variant={c.status === "ACTIVE" ? "warning" : c.status === "MANAGED" ? "success" : "neutral"}>
                    {c.status}
                  </Badge>
                </div>
                {c.diagnosedAt && <p className="mt-1 text-xs text-surface-400">Since {formatDate(c.diagnosedAt)}</p>}
                {c.notes && <p className="mt-1 text-xs text-surface-500">{c.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" /> Nearby health alerts
            </CardTitle>
            <CardDescription>
              Opt in to get a heads-up if a contagious illness is reported near your location. Only used for distance
              matching — never shared with anyone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.latitude != null && data?.longitude != null ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  Location shared
                  {data.locationUpdatedAt && ` · updated ${formatDateTime(data.locationUpdatedAt)}`}
                </span>
              </div>
            ) : (
              <p className="text-sm text-surface-400">Not sharing your location yet.</p>
            )}
            <Button variant="outline" size="sm" onClick={handleShareLocation} disabled={sharingLocation}>
              {sharingLocation ? <Spinner /> : <MapPin className="h-3.5 w-3.5" />}
              {data?.latitude != null ? "Update my location" : "Share my location"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
