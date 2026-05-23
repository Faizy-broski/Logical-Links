'use client'

import { useEffect, useState } from 'react'

import AdminSidebar from '@/components/admin/AdminSidebar'
import ShipperSidebar from '@/components/shipper/ShipperSidebar'

import AdminHeader from '@/components/admin/AdminHeader'
import ShipperHeader from '@/components/shipper/ShipperHeader'

import { Toaster } from '@/components/ui/sonner'

import { createClient } from '@/lib/supabase/client'

interface Props {
  children: React.ReactNode
}

type UserRole =
  | 'admin'
  | 'shipper'
  | null

export default function DashboardShell({
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const [role, setRole] =
    useState<UserRole>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setRole(data?.role ?? 'shipper')
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div
        className="
          flex h-screen items-center
          justify-center bg-background
        "
      >
        <div className="space-y-3 text-center">
          <div
            className="
              mx-auto h-10 w-10 animate-spin
              rounded-full border-2
              border-primary border-t-transparent
            "
          />

          <p className="text-sm text-muted">
            Loading dashboard...
          </p>
        </div>
      </div>
    )
  }

  const isAdmin = role === 'admin'

  return (
    <div
      className="
        flex h-screen overflow-hidden
        bg-background
      "
    >
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() =>
            setSidebarOpen(false)
          }
          className="
            fixed inset-0 z-40
            bg-black/40 backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* Sidebar */}
      {isAdmin ? (
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() =>
            setSidebarOpen(false)
          }
        />
      ) : (
        <ShipperSidebar
          isOpen={sidebarOpen}
          onClose={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* Main Layout */}
      <div
        className="
          flex min-w-0 flex-1
          flex-col overflow-hidden
        "
      >
        {/* Header */}
        {isAdmin ? (
          <AdminHeader
            notificationCount={4}
            onMenuToggle={() =>
              setSidebarOpen((v) => !v)
            }
          />
        ) : (
          <ShipperHeader
            notificationCount={2}
            onMenuToggle={() =>
              setSidebarOpen((v) => !v)
            }
          />
        )}

        {/* Main Content */}
        <main
          className="
            flex-1 overflow-y-auto

            bg-background

            px-4 py-4
            sm:px-5 sm:py-5
            lg:px-6 lg:py-6

            [scrollbar-width:none]
            [-ms-overflow-style:none]

            [&::-webkit-scrollbar]:hidden
          "
        >
          <div className="mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Toast */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 3000,
        }}
      />
    </div>
  )
}