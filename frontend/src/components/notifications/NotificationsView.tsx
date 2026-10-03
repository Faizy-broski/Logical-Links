'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore, Bell, CheckCheck, Megaphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useNotifications,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useArchiveNotifications,
  useDeleteNotifications,
  type NotificationCategory,
} from '@/hooks/use-notifications'
import { useAuthStore } from '@/store/auth.store'
import { CreateAlertSheet } from './CreateAlertSheet'
import { formatDate } from '@/lib/utils/format-date'
import { cn } from '@/lib/utils/cn'

const SEVERITY_STYLES: Record<string, string> = {
  info:     'bg-blue-50 text-blue-700 border-blue-200',
  warning:  'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

type Tab = 'all' | 'unread' | 'archived' | NotificationCategory

const ARCHIVE_RETENTION_DAYS = 30

function daysUntilPurge(archivedAt: string | null): number | null {
  if (!archivedAt) return null
  const purgeAt = new Date(archivedAt).getTime() + ARCHIVE_RETENTION_DAYS * 86_400_000
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / 86_400_000))
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',        label: 'All Alerts' },
  { id: 'unread',     label: 'Unread' },
  { id: 'deliveries', label: 'Deliveries' },
  { id: 'invoices',   label: 'Invoices' },
  { id: 'quotes',     label: 'Quotes' },
  { id: 'support',    label: 'Support' },
  { id: 'account',    label: 'Account' },
  { id: 'team',       label: 'Team' },
  { id: 'operations', label: 'Operations' },
  { id: 'archived',   label: 'Archived' },
]

export function NotificationsView() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const unreadOnly = tab === 'unread'
  const archived = tab === 'archived'
  const category = tab === 'all' || tab === 'unread' || tab === 'archived' ? undefined : tab

  const { data, isLoading } = useNotifications({ page, limit: 20, unreadOnly, category, archived }, { poll: true })
  const markRead    = useMarkNotificationsRead()
  const archiveMut  = useArchiveNotifications()
  const deleteMut   = useDeleteNotifications()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.data ?? []
  const meta          = data?.meta
  const unreadCount   = meta?.unreadCount ?? 0

  function handleMarkRead(id: string) {
    markRead.mutate([id], { onError: (err) => toast.error((err as Error).message) })
  }

  function handleArchive(id: string, next: boolean) {
    archiveMut.mutate(
      { ids: [id], archived: next },
      {
        onSuccess: () => toast.success(next ? 'Alert archived' : 'Alert restored'),
        onError: (err) => toast.error((err as Error).message),
      },
    )
  }

  function handleDelete(id: string) {
    if (!window.confirm('Permanently delete this alert? This cannot be undone.')) return
    deleteMut.mutate([id], {
      onSuccess: () => toast.success('Alert deleted'),
      onError: (err) => toast.error((err as Error).message),
    })
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, { onError: (err) => toast.error((err as Error).message) })
  }

  function handleTabChange(next: Tab) {
    setTab(next)
    setPage(1)
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Alerts</h1>
          <p className="mt-1 text-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-sidebar transition-colors hover:bg-primary/85"
            >
              <Megaphone className="h-4 w-4" />
              Create Alert
            </button>
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {isAdmin && <CreateAlertSheet open={createOpen} onClose={() => setCreateOpen(false)} />}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={cn(
              "rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-card-border bg-card text-muted hover:bg-primary/5 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted">{archived ? 'No archived alerts.' : 'No alerts yet.'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-card-border">
            {notifications.map((n) => (
              <li
                key={n.notification_id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors",
                  !n.is_read && "bg-primary/5",
                )}
              >
                <div className="mt-1 shrink-0">
                  {n.is_read ? (
                    <div className="h-2 w-2 rounded-full bg-transparent" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("flex flex-wrap items-center gap-2 text-sm font-medium", n.is_read ? "text-muted" : "text-foreground")}>
                    {n.title}
                    {n.severity && (
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", SEVERITY_STYLES[n.severity])}>
                        {n.severity}
                      </span>
                    )}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-400">
                    {formatDate(n.created_at)}
                    {archived && daysUntilPurge(n.archived_at) !== null && (
                      <> · auto-deletes in {daysUntilPurge(n.archived_at)} day{daysUntilPurge(n.archived_at) === 1 ? '' : 's'}</>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!n.is_read && !archived && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.notification_id)}
                      disabled={markRead.isPending}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    title={archived ? 'Restore' : 'Archive'}
                    aria-label={archived ? 'Restore alert' : 'Archive alert'}
                    onClick={() => handleArchive(n.notification_id, !archived)}
                    disabled={archiveMut.isPending}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                  >
                    {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    aria-label="Delete alert"
                    onClick={() => handleDelete(n.notification_id)}
                    disabled={deleteMut.isPending}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted">
            Page {page} of {meta.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
