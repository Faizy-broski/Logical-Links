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
  PackageCheck,
} from 'lucide-react'

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

export default function ShipperHeader({
  notificationCount = 2,
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
        flex h-17 items-center
        justify-between

        border-b border-card-border
        bg-card/95 px-4
        backdrop-blur-xl

        sm:px-5
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
            flex h-10 w-10 items-center
            justify-center rounded-xl

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
              text-base font-semibold
              tracking-tight text-foreground
              sm:text-lg
            "
          >
            Shipper Dashboard
          </h1>

          <p
            className="
              hidden text-xs text-muted
              sm:block
            "
          >
            Track shipments & manage bookings
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div
          className="
            hidden items-center gap-2
            rounded-xl border
            border-card-border

            bg-background px-3
            lg:flex
          "
        >
          <Search className="h-4 w-4 text-muted" />

          <input
            type="text"
            placeholder="Search shipments..."
            className="
              h-10 w-47.5
              bg-transparent text-sm
              text-foreground outline-none

              placeholder:text-muted-light
            "
          />
        </div>

        {/* Notifications */}
        <button
          className="
            relative flex h-10 w-10
            items-center justify-center
            rounded-xl

            border border-card-border
            bg-background

            text-muted
            transition-all duration-200

            hover:border-primary/30
            hover:bg-primary/5
            hover:text-primary
          "
        >
          <Bell className="h-4.5 w-4.5" />

          {notificationCount > 0 && (
            <span
              className="
                absolute -right-1 -top-1
                flex h-4.5 min-w-4.5
                items-center justify-center

                rounded-full bg-primary
                px-1 text-[9px]
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
                flex items-center gap-2.5
                rounded-xl border
                border-card-border

                bg-background px-2.5 py-1.5

                transition-all duration-200

                hover:border-primary/30
                hover:bg-primary/5
              "
            >
              {/* Avatar */}
              <div
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-xl

                  bg-primary

                  text-xs font-bold
                  text-sidebar
                "
              >
                SH
              </div>

              {/* User */}
              <div className="hidden text-left sm:block">
                <p
                  className="
                    text-sm font-semibold
                    text-foreground
                  "
                >
                  Shipper User
                </p>

                <p
                  className="
                    text-[11px] text-muted
                  "
                >
                  Customer Account
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
              w-60 rounded-2xl
              border border-card-border
              bg-card p-2 shadow-lg
            "
          >
            {/* User Info */}
            <div
              className="
                mb-2 flex items-center
                gap-3 rounded-xl
                bg-background p-3
              "
            >
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl

                  bg-primary

                  text-xs font-bold
                  text-sidebar
                "
              >
                SH
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate text-sm
                    font-semibold text-foreground
                  "
                >
                  Shipper User
                </p>

                <p
                  className="
                    truncate text-xs
                    text-muted
                  "
                >
                  shipper@logicallinks.com
                </p>
              </div>
            </div>

            {/* Menu */}
            <DropdownMenuItem asChild>
              <Link
                href="/shipper/profile"
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

            <DropdownMenuItem asChild>
              <Link
                href="/shipper/shipments"
                className="
                  flex cursor-pointer
                  items-center gap-2
                  rounded-xl
                "
              >
                <PackageCheck className="h-4 w-4" />
                My Shipments
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/shipper/settings"
                className="
                  flex cursor-pointer
                  items-center gap-2
                  rounded-xl
                "
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout */}
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