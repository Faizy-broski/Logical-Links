import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse, type PaginatedResponse } from "@/lib/api";
import type {
  ContactMessage,
  ContactMessageReply,
  ContactMessageWithReplies,
  UpdateContactMessageStatusDto,
  ListContactMessagesQuery,
} from "@/types/api.types";

const KEYS = {
  all:  ["contact-messages"] as const,
  list: (q: ListContactMessagesQuery) => ["contact-messages", "list", q] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────────

export function useContactMessages(query: ListContactMessagesQuery = {}) {
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn:  () => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => v !== undefined && params.set(k, String(v)));
      return api.get<PaginatedResponse<ContactMessage>>(`/api/v1/contact?${params}`);
    },
    staleTime: 30_000,
  });
}

export function useContactMessage(id: string | null) {
  return useQuery({
    queryKey: ["contact-messages", "detail", id] as const,
    queryFn:  () => api.get<ApiResponse<ContactMessageWithReplies>>(`/api/v1/contact/${id}`),
    enabled:  !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useUpdateContactMessageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateContactMessageStatusDto }) =>
      api.patch<ApiResponse<ContactMessage>>(`/api/v1/contact/${id}/status`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useReplyToContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.post<ApiResponse<ContactMessageReply>>(`/api/v1/contact/${id}/reply`, { body }),
    // Invalidate even on failure: the reply row is saved with email_status 'failed'.
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useArchiveContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.patch<ApiResponse<ContactMessage>>(`/api/v1/contact/${id}/${archived ? "archive" : "unarchive"}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
