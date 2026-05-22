"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, Phone, Building2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterSchema } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<RegisterSchema>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterSchema, string>>
  >({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = registerSchema.safeParse(form);

    if (!result.success) {
      const formattedErrors: Partial<Record<keyof RegisterSchema, string>> = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterSchema;
        formattedErrors[field] = issue.message;
      });

      setFieldErrors(formattedErrors);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data.user;

      if (!user) {
        setError("User creation failed. Please try again.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          first_name: result.data.firstName,
          last_name: result.data.lastName,
          company_name: result.data.company,
          phone: result.data.phone,
          role: "shipper",
        });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">

      {/* Glow */}
      <div className="absolute -left-30 -top-30 h-80 w-[320px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-30 -right-30 h-80 w-[320px] rounded-full bg-primary/10 blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-4xl border border-card-border bg-card shadow-lg">

        <div className="h-1.5 w-full bg-linear-to-r from-primary-dark via-primary to-primary-light" />

        <div className="p-8 sm:p-10">

          {/* Logo */}
          <Link href="/" className="mb-8 flex justify-center">
            <img
              src="/logical-links-logo.png"
              alt="Logical Links"
              className="h-14 w-auto"
            />
          </Link>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-muted">
              Register your logistics account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* First + Last Name */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* First Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  First Name
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="h-12 w-full rounded-2xl border border-card-border bg-background pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-danger">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Last Name
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="h-12 w-full rounded-2xl border border-card-border bg-background pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-danger">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Company Name
              </label>

              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />

                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Logical Links Inc."
                  className="h-12 w-full rounded-2xl border border-card-border bg-background pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {fieldErrors.company && (
                <p className="mt-1 text-xs text-danger">
                  {fieldErrors.company}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Phone Number
              </label>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className="h-12 w-full rounded-2xl border border-card-border bg-background pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-danger">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-2xl border border-card-border bg-background pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {fieldErrors.email && (
                <p className="mt-1 text-xs text-danger">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-2xl border border-card-border bg-background pl-12 pr-12 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {fieldErrors.password && (
                <p className="mt-1 text-xs text-danger">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-sidebar hover:bg-primary-dark disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:opacity-80">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}