"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, ApiError, type ApiResponse } from "@/lib/api";

type Validation =
  | { valid: true; customerType: "corporate" | "residential"; name: string; email: string; expiresAt: string }
  | { valid: false; code: string; message: string };

const inputCls =
  "h-12 w-full rounded-2xl border border-card-border bg-background pl-12 pr-12 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

// Same rules the server enforces (and the registration form uses).
function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute -left-30 -top-30 h-80 w-[320px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-30 -right-30 h-80 w-[320px] rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-card-border bg-card shadow-lg">
        <div className="h-1.5 w-full bg-linear-to-r from-primary-dark via-primary to-primary-light" />
        <div className="p-8 sm:p-10">
          <Link href="/" className="mb-8 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logical-links-logo.png" alt="Logical Links" className="h-14 w-auto" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

function ActivateForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [validation, setValidation] = useState<Validation | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidation({ valid: false, code: "INVITATION_INVALID", message: "This activation link is not valid. Please ask Logical Links to send a new invitation." });
      return;
    }
    let cancelled = false;
    api
      .post<ApiResponse<Validation>>("/api/v1/invitations/validate", { token })
      .then((res) => { if (!cancelled) setValidation(res.data); })
      .catch((err) => {
        if (cancelled) return;
        setValidation({
          valid: false,
          code: "INVITATION_INVALID",
          message: err instanceof ApiError && err.status === 429
            ? "Too many attempts. Please wait a few minutes and try again."
            : "We could not check this activation link. Please try again.",
        });
      });
    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) { setError(problem); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError("");
    try {
      await api.post("/api/v1/invitations/accept", { token, password });
      setDone(true);
      setTimeout(() => router.replace("/login?activated=1"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!validation) {
    return (
      <Shell>
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Shell>
    );
  }

  if (!validation.valid) {
    const used = validation.code === "INVITATION_USED";
    return (
      <Shell>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {used ? "Account already activated" : "This link can't be used"}
          </h1>
          <p className="mt-3 text-sm text-muted">{validation.message}</p>
          <div className="mt-8 flex flex-col gap-3">
            {used ? (
              <Button asChild className="w-full"><Link href="/login">Sign in</Link></Button>
            ) : (
              <>
                <Button asChild className="w-full"><Link href="/contact-support">Contact Logical Links</Link></Button>
                <Link href="/login" className="text-sm text-primary hover:underline">Back to sign in</Link>
              </>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account activated</h1>
          <p className="mt-3 text-sm text-muted">Taking you to the sign-in page…</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Activate your account</h1>
        <p className="mt-2 text-sm text-muted">
          {validation.name ? `Welcome, ${validation.name}. ` : ""}
          Choose a password for <span className="font-medium text-foreground">{validation.email}</span> to finish setting up
          your {validation.customerType === "corporate" ? "Corporate Customer" : "Logical Links"} account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted">Use at least 8 characters, including one uppercase letter and one number.</p>
        </div>

        <div>
          <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-foreground">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className={inputCls}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Activating…" : "Activate account"}
        </Button>
      </form>
    </Shell>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivateForm />
    </Suspense>
  );
}
