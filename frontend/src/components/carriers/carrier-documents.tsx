"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink, FileText, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanyOptionSelect } from "@/components/ui/company-option-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Section, SectionAction } from "@/components/profile/profile-kit";
import {
  MAX_DOCUMENT_BYTES,
  openCarrierDocument,
  useAddCarrierDocument,
  useDeleteCarrierDocument,
  useUpdateCarrierDocument,
} from "@/hooks/use-carriers";
import { DOCUMENT_TYPES, DOCUMENT_WARNING_DAYS, expiryState, formatDay } from "@/lib/carrier-options";
import {
  DOCUMENT_VERIFICATION_META,
  DOCUMENT_VERIFICATION_STATUSES,
  type CarrierDocument,
  type DocumentVerificationStatus,
} from "@/types/api.types";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

type Draft = {
  key: string;
  documentType: string;
  issueDate: string;
  expiryDate: string;
  verificationStatus: DocumentVerificationStatus;
  notes: string;
};

function newDraft(): Draft {
  return { key: crypto.randomUUID(), documentType: "", issueDate: "", expiryDate: "", verificationStatus: "not_reviewed", notes: "" };
}

export function CarrierDocuments({
  carrierId,
  documents,
  canEdit,
}: {
  carrierId: string;
  documents: CarrierDocument[];
  canEdit: boolean;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const flagged = documents.filter((d) => {
    const s = expiryState(d.expiry_date);
    return s === "expired" || s === "soon";
  }).length;

  return (
    <Section
      title={`Documents${documents.length ? ` (${documents.length})` : ""}`}
      description={
        flagged > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            {flagged} expired or expiring within {DOCUMENT_WARNING_DAYS} days
          </span>
        ) : (
          `Expiring documents are flagged ${DOCUMENT_WARNING_DAYS} days ahead`
        )
      }
      action={canEdit && (
        <SectionAction icon={Plus} onClick={() => setDrafts((list) => [...list, newDraft()])}>
          {documents.length + drafts.length === 0 ? "Add document" : "Add another document"}
        </SectionAction>
      )}
    >
      {documents.length === 0 && drafts.length === 0 && (
        <p className="text-sm text-muted">No documents uploaded yet.</p>
      )}

      {documents.length > 0 && (
        <ul className="divide-y divide-card-border">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} carrierId={carrierId} doc={doc} canEdit={canEdit} />
          ))}
        </ul>
      )}

      {drafts.length > 0 && (
        <div className={documents.length > 0 ? "mt-4 space-y-3" : "space-y-3"}>
          {drafts.map((draft) => (
            <NewDocumentForm
              key={draft.key}
              carrierId={carrierId}
              initial={draft}
              onDone={() => setDrafts((list) => list.filter((d) => d.key !== draft.key))}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

/* ─── Existing document ───────────────────────────────────────────────────── */

function ExpiryFlag({ expiry }: { expiry: string | null }) {
  const state = expiryState(expiry);
  if (state === "expired") {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><AlertTriangle className="h-3 w-3" />Expired</span>;
  }
  if (state === "soon") {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><AlertTriangle className="h-3 w-3" />Expires soon</span>;
  }
  return null;
}

function DocumentRow({ carrierId, doc, canEdit }: { carrierId: string; doc: CarrierDocument; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const deleteMut = useDeleteCarrierDocument(carrierId);
  const verification = DOCUMENT_VERIFICATION_META[doc.verification_status];

  async function open() {
    setOpening(true);
    try {
      await openCarrierDocument(carrierId, doc.id);
    } catch (err) {
      toast.error((err as Error).message ?? "Could not open the document");
    } finally {
      setOpening(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteMut.mutateAsync(doc.id);
      toast.success("Document deleted");
      setDeleteOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (editing) {
    return (
      <li className="py-3 first:pt-0">
        <EditDocumentForm carrierId={carrierId} doc={doc} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-foreground">{doc.document_type}</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${verification.dot}`} />
              {verification.label}
            </span>
            <ExpiryFlag expiry={doc.expiry_date} />
          </div>
          <button
            type="button"
            onClick={open}
            disabled={opening}
            className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-foreground underline decoration-card-border underline-offset-4 hover:text-primary hover:decoration-primary disabled:opacity-60"
          >
            {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />}
            <span className="truncate">{doc.file_name}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted" />
          </button>
          <p className="mt-1 text-xs text-muted">
            Issued {formatDay(doc.issue_date)} · Expires {formatDay(doc.expiry_date)} · Uploaded {formatDay(doc.created_at)}
          </p>
          {doc.notes && <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{doc.notes}</p>}
        </div>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-1">
            <SectionAction icon={Pencil} onClick={() => setEditing(true)}>Edit</SectionAction>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label={`Delete ${doc.document_type}`}
              className="-mt-0.5 inline-flex items-center rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteMut.isPending}
        title="Delete document"
        description={<>Delete {doc.document_type} ({doc.file_name})? The uploaded file is removed permanently.</>}
        confirmLabel="Delete"
      />
    </li>
  );
}

/* ─── Forms ───────────────────────────────────────────────────────────────── */

function NewDocumentForm({ carrierId, initial, onDone }: { carrierId: string; initial: Draft; onDone: () => void }) {
  const addMut = useAddCarrierDocument(carrierId);
  return (
    <DocumentForm
      title="New document"
      initial={initial}
      fileRequired
      saving={addMut.isPending}
      onCancel={onDone}
      onSave={async (values, file) => {
        await addMut.mutateAsync({ file: file!, input: values });
        toast.success(`${values.documentType} uploaded`);
        onDone();
      }}
    />
  );
}

function EditDocumentForm({ carrierId, doc, onDone }: { carrierId: string; doc: CarrierDocument; onDone: () => void }) {
  const updateMut = useUpdateCarrierDocument(carrierId);
  return (
    <DocumentForm
      title="Edit document"
      currentFileName={doc.file_name}
      initial={{
        key: doc.id,
        documentType: doc.document_type,
        issueDate: doc.issue_date ?? "",
        expiryDate: doc.expiry_date ?? "",
        verificationStatus: doc.verification_status,
        notes: doc.notes ?? "",
      }}
      saving={updateMut.isPending}
      onCancel={onDone}
      onSave={async (values, file) => {
        await updateMut.mutateAsync({ documentId: doc.id, file, input: values });
        toast.success("Document updated");
        onDone();
      }}
    />
  );
}

function DocumentForm({
  title,
  initial,
  currentFileName,
  fileRequired = false,
  saving,
  onSave,
  onCancel,
}: {
  title: string;
  initial: Draft;
  currentFileName?: string;
  fileRequired?: boolean;
  saving: boolean;
  onSave: (values: Omit<Draft, "key">, file: File | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_DOCUMENT_BYTES) {
      toast.error("Files must be 20 MB or smaller");
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!values.documentType) return void toast.error("Choose a document type");
    if (fileRequired && !file) return void toast.error("Choose a file to upload");
    if (values.issueDate && values.expiryDate && values.expiryDate < values.issueDate) {
      return void toast.error("Expiry date can't be before the issue date");
    }
    const { key: _key, ...rest } = values;
    try {
      await onSave({ ...rest, notes: rest.notes.trim() }, file);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save document");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-card-border bg-background p-4">
      <p className="text-xs font-medium text-foreground">{title}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Document type *</Label>
          <CompanyOptionSelect value={values.documentType} onChange={(v) => set("documentType", v)} options={DOCUMENT_TYPES} placeholder="Select document type" />
        </div>

        <div className="space-y-1.5">
          <Label>{currentFileName ? "Replace file" : "Upload file *"}</Label>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} className="h-9 w-full justify-start rounded-lg font-normal">
            <Upload className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{file?.name ?? currentFileName ?? "Choose file (PDF, image or Word, max 20 MB)"}</span>
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`issue-${initial.key}`}>Issue date</Label>
          <Input id={`issue-${initial.key}`} type="date" value={values.issueDate} onChange={(e) => set("issueDate", e.target.value)} className="rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`expiry-${initial.key}`}>Expiry date</Label>
          <Input id={`expiry-${initial.key}`} type="date" value={values.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} className="rounded-lg" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Verification status</Label>
          <SearchableSelect
            value={values.verificationStatus}
            onValueChange={(v) => set("verificationStatus", v as DocumentVerificationStatus)}
            options={DOCUMENT_VERIFICATION_STATUSES.map((s) => ({ value: s, label: DOCUMENT_VERIFICATION_META[s].label }))}
            placeholder="Select status"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`notes-${initial.key}`}>Notes</Label>
          <Textarea id={`notes-${initial.key}`} rows={2} maxLength={2000} placeholder="Optional comments about this document" value={values.notes} onChange={(e) => set("notes", e.target.value)} className="rounded-lg" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="button" size="sm" onClick={submit} disabled={saving} className="bg-primary text-sidebar hover:bg-primary/85">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save document"}
        </Button>
      </div>
    </div>
  );
}
