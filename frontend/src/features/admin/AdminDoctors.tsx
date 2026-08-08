import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import * as doctorsApi from "@/api/doctors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import type { HospitalAdminProfile } from "@/types";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  specialty: "",
  qualification: "",
  phone: "",
  consultationFee: "",
};

export default function AdminDoctors() {
  const user = useAuthStore((s) => s.user);
  const admin = user?.profile as HospitalAdminProfile;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const doctorsQuery = useQuery({
    queryKey: ["admin-doctors", admin?.hospitalId],
    queryFn: () => doctorsApi.listDoctors({ hospitalId: admin!.hospitalId }),
    enabled: !!admin?.hospitalId,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!admin?.hospitalId) return;
    setSaving(true);
    try {
      await doctorsApi.createDoctor({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        specialty: form.specialty,
        hospitalId: admin.hospitalId,
        qualification: form.qualification || undefined,
        phone: form.phone || undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
      });
      toast({ title: "Doctor added", variant: "success" });
      setDialogOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["admin-doctors", admin.hospitalId] });
    } catch (err) {
      toast({ title: "Couldn't add doctor", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">Doctors</h1>
          <p className="mt-1 text-sm text-surface-500">Manage clinical staff at your hospital.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4" /> Add doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a doctor</DialogTitle>
              <DialogDescription>Creates a login for the doctor at your hospital.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full name</Label>
                <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Input required value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Qualification</Label>
                <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Consultation fee</Label>
                <Input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Spinner />}
                  Create doctor account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctorsQuery.isLoading && <Spinner className="h-6 w-6" />}
        {(doctorsQuery.data ?? []).map((doc) => (
          <Card key={doc.id}>
            <CardContent className="flex items-start gap-3 py-4">
              <Avatar name={doc.fullName} size={10} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Dr. {doc.fullName}</p>
                <Badge variant="neutral" className="mt-1">
                  {doc.specialty}
                </Badge>
                {doc.qualification && <p className="mt-1 text-xs text-surface-400">{doc.qualification}</p>}
                {doc.consultationFee != null && <p className="mt-1 text-xs text-surface-500">₹{doc.consultationFee} / visit</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
