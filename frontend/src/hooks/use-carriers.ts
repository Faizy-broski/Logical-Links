import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse, type PaginatedResponse } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type {
  Carrier,
  CarrierDocument,
  CarrierDocumentInput,
  CreateCarrierDto,
  UpdateCarrierDto,
} from "@/types/api.types";

const DOCUMENTS_BUCKET = "carrier-documents";
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

const KEYS = {
  all:    ["carriers"] as const,
  list:   ["carriers", "list"] as const,
  detail: (id: string) => ["carriers", id] as const,
};

// The list page filters/searches client-side, so this loads the whole list (≤ 500).
export function useCarriers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: KEYS.list,
    queryFn:  () => api.get<PaginatedResponse<Carrier>>("/api/v1/carriers?limit=500"),
    enabled:  options.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useCarrier(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn:  () => api.get<ApiResponse<Carrier>>(`/api/v1/carriers/${id}`),
    enabled:  !!id,
  });
}

export function useCreateCarrier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCarrierDto) =>
      api.post<ApiResponse<Carrier>>("/api/v1/carriers", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateCarrier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCarrierDto }) =>
      api.patch<ApiResponse<Carrier>>(`/api/v1/carriers/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteCarrier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<ApiResponse<null>>(`/api/v1/carriers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

// ── Documents ─────────────────────────────────────────────────────────────────
// Files go straight to the private bucket via a backend-issued signed upload
// URL; the backend then records the document against the carrier.

type UploadedFile = { filePath: string; fileName: string; fileSize: number; mimeType: string };

async function uploadDocumentFile(carrierId: string, file: File): Promise<UploadedFile> {
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Files must be 20 MB or smaller");

  const res = await api.post<ApiResponse<{ signedUrl: string; token: string; path: string }>>(
    `/api/v1/carriers/${carrierId}/documents/upload-url`,
    { fileName: file.name, fileSize: file.size },
  );
  const { token, path } = res.data;
  const mimeType = file.type || "application/octet-stream";

  const { error } = await createClient()
    .storage.from(DOCUMENTS_BUCKET)
    .uploadToSignedUrl(path, token, file, { contentType: mimeType, upsert: true });
  if (error) throw new Error(error.message);

  return { filePath: path, fileName: file.name, fileSize: file.size, mimeType };
}

export function useAddCarrierDocument(carrierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, input }: { file: File; input: CarrierDocumentInput }) => {
      const uploaded = await uploadDocumentFile(carrierId, file);
      return api.post<ApiResponse<CarrierDocument>>(`/api/v1/carriers/${carrierId}/documents`, {
        ...input,
        ...uploaded,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateCarrierDocument(carrierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, file, input }: { documentId: string; file?: File | null; input: CarrierDocumentInput }) => {
      const uploaded = file ? await uploadDocumentFile(carrierId, file) : {};
      return api.patch<ApiResponse<CarrierDocument>>(
        `/api/v1/carriers/${carrierId}/documents/${documentId}`,
        { ...input, ...uploaded },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteCarrierDocument(carrierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      api.delete<ApiResponse<null>>(`/api/v1/carriers/${carrierId}/documents/${documentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

/** Opens a document in a new tab via a short-lived signed URL. */
export async function openCarrierDocument(carrierId: string, documentId: string) {
  // Open the tab synchronously so popup blockers allow it, then point it at the file.
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  try {
    const res = await api.get<ApiResponse<{ url: string }>>(
      `/api/v1/carriers/${carrierId}/documents/${documentId}/url`,
    );
    if (tab) tab.location.href = res.data.url;
    else window.location.href = res.data.url;
  } catch (err) {
    tab?.close();
    throw err;
  }
}
