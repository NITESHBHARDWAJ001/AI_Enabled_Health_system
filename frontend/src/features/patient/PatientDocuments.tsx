import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileText, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import * as documentsApi from "@/api/documents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/formatters";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";
import type { PatientProfile } from "@/types";
import { API_BASE_URL } from "@/api/client";

const DOCUMENT_TYPES = [
  "PRESCRIPTION",
  "LAB_REPORT",
  "XRAY",
  "MRI",
  "CT",
  "DISCHARGE_SUMMARY",
  "OTHER",
];

function resolveUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL.replace(/\/api\/v1$/, "")}${url}`;
}

export default function PatientDocuments() {
  const user = useAuthStore((s) => s.user);
  const patient = user?.profile as PatientProfile;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState("LAB_REPORT");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const documentsQuery = useQuery({
    queryKey: ["documents", patient?.id],
    queryFn: () => documentsApi.listDocuments(patient!.id),
    enabled: !!patient?.id,
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !patient?.id) return;
    setUploading(true);
    try {
      await documentsApi.uploadDocument(patient.id, documentType, file);
      toast({ title: "Document uploaded", variant: "success" });
      setDialogOpen(false);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["documents", patient.id] });
    } catch (err) {
      toast({ title: "Upload failed", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">Documents</h1>
          <p className="mt-1 text-sm text-surface-500">Prescriptions, lab reports, scans — all in one place.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UploadCloud className="h-4 w-4" />
              Upload document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload a document</DialogTitle>
              <DialogDescription>Stored securely and linked to your medical timeline.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Document type</Label>
                <Select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>File</Label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-surface-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>
              <Button type="submit" className="w-full" disabled={uploading || !file}>
                {uploading && <Spinner />}
                Upload
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documentsQuery.isLoading && <Spinner className="h-6 w-6" />}
        {!documentsQuery.isLoading && (documentsQuery.data ?? []).length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-10 text-center text-sm text-surface-400">No documents uploaded yet.</CardContent>
          </Card>
        )}
        {(documentsQuery.data ?? []).map((doc) => (
          <Card key={doc.id}>
            <CardContent className="flex items-start gap-3 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{doc.fileName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="neutral">{doc.documentType.replace(/_/g, " ")}</Badge>
                  <span className="text-xs text-surface-400">{formatDate(doc.uploadedAt)}</span>
                </div>
                <a
                  href={resolveUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
