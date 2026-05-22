'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

import {
  loginSchema,
  type LoginSchema,
} from '@/lib/validations/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirect =
    searchParams.get('redirect') ?? '/'

  const [form, setForm] =
    useState<LoginSchema>({
      email: '',
      password: '',
    })

  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginSchema, string>>
  >({})

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setError(null)

    // Zod validation
    const result =
      loginSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Partial<
        Record<keyof LoginSchema, string>
      > = {}

      result.error.issues.forEach((err) => {
        const field =
          err.path[0] as keyof LoginSchema

        fieldErrors[field] = err.message
      })

      setErrors(fieldErrors)

      return
    }

    setErrors({})
    setLoading(true)

    const supabase = createClient()

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: profile } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single()

    const role = (profile as any)?.role

    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else if (role === 'shipper') {
      router.push('/shipper/dashboard')
    } else {
      router.push(redirect)
    }

    router.refresh()
  }

  return (
    <div
      className="
        relative flex min-h-screen
        items-center justify-center
        overflow-hidden bg-background
        px-4 py-10
      "
    >
      {/* Background */}
      <div
        className="
          absolute -left-30 -top-30
          h-80 w-[320px]
          rounded-full bg-primary/10 blur-3xl
        "
      />

      <div
        className="
          absolute -bottom-30 -right-30
          h-80 w-[320px]
          rounded-full bg-primary/10 blur-3xl
        "
      />

      {/* Card */}
      <div
        className="
          relative z-10 w-full max-w-md
          overflow-hidden rounded-4xl
          border border-card-border
          bg-card shadow-lg
        "
      >
        <div
          className="
            h-1.5 w-full
            bg-linear-to-r
            from-primary-dark
            via-primary
            to-primary-light
          "
        />

        <div className="p-8 sm:p-10">
          {/* Logo */}
          <Link
            href="/"
            className="mb-8 flex justify-center"
          >
            <img
              src="/logical-links-logo.png"
              alt="Logical Links"
              className="h-14 w-auto"
            />
          </Link>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1
              className="
                text-3xl font-semibold
                tracking-tight text-foreground
              "
            >
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-muted">
              Sign in to access your dashboard
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="
                  mb-2 block text-sm
                  font-medium text-foreground
                "
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  className="
                    absolute left-4 top-1/2
                    h-5 w-5 -translate-y-1/2
                    text-muted
                  "
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@example.com"
                  className="
                    h-12 w-full rounded-2xl
                    border border-card-border
                    bg-background
                    pl-12 pr-4
                    text-sm text-foreground
                    outline-none transition-all

                    placeholder:text-muted-light

                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/10
                  "
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-xs text-danger">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="
                    text-sm font-medium
                    text-foreground
                  "
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="
                    text-xs font-medium
                    text-primary hover:opacity-80
                  "
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Lock
                  className="
                    absolute left-4 top-1/2
                    h-5 w-5 -translate-y-1/2
                    text-muted
                  "
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password:
                        e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  className="
                    h-12 w-full rounded-2xl
                    border border-card-border
                    bg-background
                    pl-12 pr-12
                    text-sm text-foreground
                    outline-none transition-all

                    placeholder:text-muted-light

                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/10
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="
                    absolute right-4 top-1/2
                    -translate-y-1/2
                    text-muted
                    hover:text-foreground
                  "
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-xs text-danger">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Auth Error */}
            {error && (
              <div
                className="
                  rounded-2xl border
                  border-danger/20
                  bg-danger/5
                  px-4 py-3
                  text-sm text-danger
                "
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                flex h-12 w-full
                items-center justify-center
                rounded-2xl

                bg-primary
                text-sm font-semibold
                text-sidebar

                transition-all duration-200

                hover:bg-primary-dark
                hover:shadow-md

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="
                  font-semibold text-primary
                  hover:opacity-80
                "
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}