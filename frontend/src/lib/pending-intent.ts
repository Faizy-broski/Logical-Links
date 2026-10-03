import { dashboardPathForRole } from "@/lib/utils/dashboard-path";

// A quote filled in on the landing page before the visitor has signed in is
// stashed here, carried through login / register / Google sign-in, and picked
// up by the dashboard quote page, which prefills (and, for corporate, submits)
// it. localStorage rather than sessionStorage so it survives the email-verify
// tab hop. Same try/catch convention as lib/google-auth.ts.

const KEY = "ll-pending-quote";
const TTL_MS = 60 * 60 * 1000;

export type QuoteDraftAddress = {
  address: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  postcode: string;
};

export type QuoteDraft = {
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerPhone: string;
  origin: QuoteDraftAddress;
  destination: QuoteDraftAddress;
  serviceType: string;
  serviceLevel: string;
  cargoDescription: string;
  pieces: string;
  weightKg: string;
  preferredDeliveryDate: string;
  notes: string;
};

type Stored = { draft: QuoteDraft; ts: number };

export function writePendingQuote(draft: QuoteDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ draft, ts: Date.now() } satisfies Stored));
  } catch {
    /* storage unavailable — the visitor just re-enters the quote */
  }
}

export function peekPendingQuote(): QuoteDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (!stored?.draft || Date.now() - stored.ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return stored.draft;
  } catch {
    return null;
  }
}

// Read-and-clear, so a refresh can never submit the same quote twice.
export function takePendingQuote(): QuoteDraft | null {
  const draft = peekPendingQuote();
  clearPendingQuote();
  return draft;
}

export function clearPendingQuote(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function quotePathForRole(role: string | undefined): string | null {
  if (role === "residential") return "/residential/quotations";
  if (role === "corporate") return "/corporate/quotations/request";
  return null;
}

// ── Customer Support ─────────────────────────────────────────────────────────
// A visitor who sent the Customer Support form and then chooses to sign in gets
// a support ticket created from it, shown on their Support page.

const SUPPORT_KEY = "ll-pending-support";

export type SupportDraft = { subject: string; description: string };

export function writePendingSupport(draft: SupportDraft): void {
  try {
    localStorage.setItem(SUPPORT_KEY, JSON.stringify({ draft, ts: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function peekPendingSupport(): SupportDraft | null {
  try {
    const raw = localStorage.getItem(SUPPORT_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { draft?: SupportDraft; ts: number };
    if (!stored?.draft || Date.now() - stored.ts > TTL_MS) {
      localStorage.removeItem(SUPPORT_KEY);
      return null;
    }
    return stored.draft;
  } catch {
    return null;
  }
}

export function takePendingSupport(): SupportDraft | null {
  const draft = peekPendingSupport();
  try {
    localStorage.removeItem(SUPPORT_KEY);
  } catch {
    /* ignore */
  }
  return draft;
}

export function supportPathForRole(role: string | undefined): string | null {
  if (role === "residential") return "/residential/support";
  if (role === "corporate") return "/corporate/support";
  return null;
}

// Where to send a user right after they authenticate: the dashboard page that
// picks up whatever they started on the landing page (quote → Get a Quote,
// support request → Support), otherwise their role's dashboard.
export function postAuthPath(role: string | undefined): string {
  if (peekPendingQuote()) {
    const quotePath = quotePathForRole(role);
    if (quotePath) return quotePath;
  }
  if (peekPendingSupport()) {
    const supportPath = supportPathForRole(role);
    if (supportPath) return supportPath;
  }
  return dashboardPathForRole(role);
}
