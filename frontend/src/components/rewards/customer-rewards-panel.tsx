"use client";

import {
  useCustomerRewardsCreditSummary,
  useCustomerRewardsCreditHistory,
} from "@/hooks/use-rewards-credit";
import { Section } from "@/components/profile/profile-kit";
import type { RewardsCreditHistoryEntry } from "@/types/api.types";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

const ENTRY_META: Record<RewardsCreditHistoryEntry["type"], { label: string; tone: string }> = {
  earn:           { label: "Points earned",   tone: "text-green-700" },
  redeem:         { label: "Points redeemed", tone: "text-red-600" },
  birthday_bonus: { label: "Birthday bonus",  tone: "text-primary" },
};

// Read-only rewards balance + ledger for a residential customer, laid out as a
// profile section. Used on the admin residential customer detail page.
export function CustomerRewardsPanel({ profileId }: { profileId: string }) {
  const { data: summaryRes, isLoading: summaryLoading } = useCustomerRewardsCreditSummary(profileId);
  const { data: historyRes, isLoading: historyLoading } = useCustomerRewardsCreditHistory(profileId);

  const points  = summaryRes?.data.points ?? 0;
  const credit  = summaryRes?.data.creditAvailable ?? 0;
  const history = historyRes?.data ?? [];

  return (
    <Section title="Rewards">
      {summaryLoading ? (
        <div className="h-12 animate-pulse rounded bg-foreground/5" />
      ) : (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted">Points available</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{points.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Delivery credit</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">${credit.toFixed(2)}</dd>
          </div>
        </dl>
      )}

      <p className="mb-2 mt-5 text-xs text-muted">Points history</p>
      {historyLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted">No rewards activity yet.</p>
      ) : (
        <ul className="max-h-72 divide-y divide-card-border overflow-y-auto">
          {history.map((entry) => {
            const meta = ENTRY_META[entry.type];
            return (
              <li key={entry.ledger_id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{entry.note ?? meta.label}</p>
                  <p className="text-xs text-muted">{fmtDate(entry.created_at)}</p>
                </div>
                <span className={`shrink-0 text-sm font-medium tabular-nums ${meta.tone}`}>
                  {entry.points > 0 ? "+" : ""}{entry.points.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
