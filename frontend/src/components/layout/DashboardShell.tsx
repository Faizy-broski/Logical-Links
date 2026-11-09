'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import CorporateSidebar from '@/components/corporate/CorporateSidebar'
import ResidentialSidebar from '@/components/residential/ResidentialSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import CorporateHeader from '@/components/corporate/CorporateHeader'
import ResidentialHeader from '@/components/residential/ResidentialHeader'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/auth.store'
import { useTheme } from '@/components/providers/theme-provider'
import { useAppearance } from '@/components/providers/appearance-provider'
import { getContentSwatchById } from '@/lib/utils/content-theme'
import { getAccentThemeById, DEFAULT_ACCENT_ID, contrastRatio, readableOn } from '@/lib/utils/accent-theme'
import { getTextSwatchById } from '@/lib/utils/text-theme'

interface Props {
  children: React.ReactNode
}

export default function DashboardShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const { theme } = useTheme()
  const { contentSwatchId, accentSwatchId, textSwatchId } = useAppearance()

  const isAdmin = user?.role === 'admin'
  const isResidential = user?.role === 'residential'
  const contentSwatch = getContentSwatchById(theme, contentSwatchId[theme])
  // Accent customization is an admin-portal-only feature — customer portals
  // (corporate / residential) always use the globals.css default accent, even
  // if a stale localStorage selection is present. Admins fall back to the
  // Stone default accent when no swatch is stored, instead of the site gold.
  const accent = isAdmin ? (getAccentThemeById(accentSwatchId[theme]) ?? getAccentThemeById(DEFAULT_ACCENT_ID)) : undefined

  // Drive the accent override from :root so it also reaches portaled UI
  // (dialogs, dropdowns, popovers, toasts) that renders outside this subtree.
  // Covers headers, primary/active buttons, the active sidebar link background,
  // focus rings, badges — anything using primary / primary-dark. Cleared on
  // unmount so it never leaks onto the marketing/auth pages.
  useEffect(() => {
    const root = document.documentElement
    const vars: Record<string, string | undefined> = {
      '--primary': accent?.primary,
      '--primary-light': accent?.primaryLight,
      '--primary-dark': accent?.primaryDark,
      '--primary-foreground': accent?.primaryForeground,
    }
    for (const [key, value] of Object.entries(vars)) {
      if (value) root.style.setProperty(key, value)
      else root.style.removeProperty(key)
    }
    return () => {
      for (const key of Object.keys(vars)) root.style.removeProperty(key)
    }
  }, [accent])

  // Text colour (any role): overrides --foreground, with --muted derived from it.
  const textSwatch = getTextSwatchById(theme, textSwatchId[theme])
  useEffect(() => {
    const root = document.documentElement
    if (textSwatch) {
      root.style.setProperty('--foreground', textSwatch.bg)
      root.style.setProperty('--muted', `color-mix(in srgb, ${textSwatch.bg} 68%, var(--background))`)
    }
    return () => {
      root.style.removeProperty('--foreground')
      root.style.removeProperty('--muted')
    }
  }, [textSwatch])

  // A light accent used as text on a light page is unreadable; give text-primary
  // a darker tone of the same hue instead (see globals.css).
  useEffect(() => {
    const root = document.documentElement
    const bg = '#ffffff'
    if (accent && theme === 'light' && contrastRatio(accent.primary, bg) < 3) {
      root.style.setProperty('--primary-text', readableOn(accent.primary, bg, 4.5))
      root.setAttribute('data-accent-light', '')
    }
    return () => {
      root.style.removeProperty('--primary-text')
      root.removeAttribute('data-accent-light')
    }
  }, [accent, theme])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      {isAdmin ? (
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      ) : isResidential ? (
        <ResidentialSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      ) : (
        <CorporateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Layout */}
      <div
        style={
          contentSwatch
            ? ({
                "--background":   contentSwatch.bg,
                "--card":          contentSwatch.card,
                "--card-border":   contentSwatch.cardBorder,
              } as CSSProperties)
            : undefined
        }
        className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
      >
        {isAdmin ? (
          <AdminHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
        ) : isResidential ? (
          <ResidentialHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
        ) : (
          <CorporateHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
        )}

        <main className="flex-1 overflow-y-auto bg-background px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 3000 }} />
    </div>
  )
}
