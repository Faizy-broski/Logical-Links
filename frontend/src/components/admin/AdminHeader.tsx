'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  Settings,
  User,
  LogOut,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { createClient } from '@/lib/supabase/client'

interface Props {
  notificationCount?: number
  onMenuToggle?: () => void
}

export default function AdminHeader({
  notificationCount = 4,
  onMenuToggle,
}: Props) {
  const router = useRouter()

  async function handleSignOut() {
    await createClient().auth.signOut()

    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-18.5 items-center
        justify-between

        border-b border-card-border
        bg-card/95 px-4
        backdrop-blur-xl

        sm:px-6
      "
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open Menu"
          className="
            flex h-11 w-11 items-center
            justify-center rounded-2xl

            border border-card-border
            bg-background

            text-muted
            transition-all duration-200

            hover:border-primary/30
            hover:bg-primary/5
            hover:text-primary

            lg:hidden
          "
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Title */}
        <div>
          <h1
            className="
              text-lg font-semibold
              tracking-tight text-foreground
              sm:text-xl
            "
          >
            Admin Dashboard
          </h1>

          <p
            className="
              hidden text-xs text-muted
              sm:block
            "
          >
            Manage shipments, customers & loads
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <button
          className="
            relative flex h-11 w-11
            items-center justify-center
            rounded-2xl

            border border-card-border
            bg-background

            text-muted
            transition-all duration-200

            hover:border-primary/30
            hover:bg-primary/5
            hover:text-primary
          "
        >
          <Bell className="h-5 w-5" />

          {notificationCount > 0 && (
            <span
              className="
                absolute -right-1 -top-1
                flex h-5 min-w-5
                items-center justify-center

                rounded-full bg-primary
                px-1 text-[10px]
                font-bold text-sidebar
              "
            >
              {notificationCount > 9
                ? '9+'
                : notificationCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="
                flex items-center gap-3
                rounded-2xl border
                border-card-border

                bg-background px-3 py-2

                transition-all duration-200

                hover:border-primary/30
                hover:bg-primary/5
              "
            >
              {/* Avatar */}
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-2xl

                  bg-primary

                  text-sm font-bold
                  text-sidebar
                "
              >
                AD
              </div>

              {/* User */}
              <div className="hidden text-left sm:block">
                <p
                  className="
                    text-sm font-semibold
                    text-foreground
                  "
                >
                  Admin User
                </p>

                <p
                  className="
                    text-xs text-muted
                  "
                >
                  Super Admin
                </p>
              </div>

              <ChevronDown
                className="
                  hidden h-4 w-4
                  text-muted sm:block
                "
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="
              w-64 rounded-2xl
              border border-card-border
              bg-card p-2 shadow-lg
            "
          >
            {/* Profile Header */}
            <div
              className="
                mb-2 flex items-center
                gap-3 rounded-2xl
                bg-background p-3
              "
            >
              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-2xl

                  bg-primary

                  text-sm font-bold
                  text-sidebar
                "
              >
                AD
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate text-sm
                    font-semibold text-foreground
                  "
                >
                  Admin User
                </p>

                <p
                  className="
                    truncate text-xs
                    text-muted
                  "
                >
                  admin@logicallinks.com
                </p>
              </div>
            </div>

            <DropdownMenuItem asChild>
              <Link
                href="/admin/profile"
                className="
                  flex cursor-pointer
                  items-center gap-2
                  rounded-xl
                "
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={handleSignOut}
              className="
                flex cursor-pointer
                items-center gap-2
                rounded-xl

                text-danger
                focus:bg-danger/10
                focus:text-danger
              "
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}