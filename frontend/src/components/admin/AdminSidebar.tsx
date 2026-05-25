"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  PackageCheck,
  Truck,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  BellRing,
} from "lucide-react";

import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Shippers",
    href: "/admin/shipper-details",
    icon: Users,
  },
  {
    label: "Loads",
    href: "/admin/load-details",
    icon: BellRing,
    children: [
      {
        label: "Loads",
        href: "/admin/load-details",
      },
      {
        label: "Create Loads",
        href: "/admin/loads/create",
      },
    ],
  },
];

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({
  isOpen = false,
  onClose,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [openMenus, setOpenMenus] = useState<
    string[]
  >(["Management"]);

  function toggleMenu(label: string) {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  }

  async function signOut() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="
            fixed inset-0 z-40
            bg-black/40 backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* Sidebar */}
     <aside
  className={cn(
    `
      fixed inset-y-0 left-0 z-50
      flex w-62 flex-col

      border-r border-sidebar-border
      bg-sidebar

      transition-transform duration-300 ease-out

      lg:relative lg:translate-x-0
    `,
    isOpen
      ? "translate-x-0"
      : "-translate-x-full lg:translate-x-0"
  )}
>
  {/* Top */}
  <div
    className="
      flex h-16 items-center
      justify-between border-b
      border-sidebar-border px-4
    "
  >
    <Link
      href="/admin/dashboard"
      className="flex items-center gap-2.5"
    >
      <div
        className="
          flex h-9 w-9 items-center
          justify-center rounded-xl
          bg-primary/10
        "
      >
        <Image
          src="/logical-links-logo.png"
          alt="Logical Links"
          width={22}
          height={22}
          className="object-contain w-10 h-auto"
        />
      </div>

      <div>
        <h2
          className="
            text-[13px] font-semibold
            tracking-wide text-white
          "
        >
          Logical Links
        </h2>

        <p
          className="
            text-[11px] text-zinc-500
          "
        >
          Shipping CMS
        </p>
      </div>
    </Link>

    <button
      onClick={onClose}
      className="
        flex h-8 w-8 items-center
        justify-center rounded-lg
        text-zinc-400 transition-colors

        hover:bg-white/5
        hover:text-white

        lg:hidden
      "
    >
      <X className="h-4 w-4" />
    </button>
  </div>

  {/* Navigation */}
  <div
    className="
      flex-1 overflow-y-auto
      px-2.5 py-3

      [scrollbar-width:none]
      [-ms-overflow-style:none]

      [&::-webkit-scrollbar]:hidden
    "
  >
    <div className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;

        const active =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        const isExpanded =
          openMenus.includes(item.label);

        if (item.children) {
          return (
            <div key={item.label}>
              <button
                onClick={() =>
                  toggleMenu(item.label)
                }
                className={cn(
                  `
                    flex w-full items-center
                    justify-between rounded-xl
                    px-3 py-2.5 text-[13px]
                    font-medium transition-all
                  `,
                  active
                    ? "bg-primary text-white"
                    : `
                      text-zinc-300
                      hover:bg-sidebar-secondary
                      hover:text-white
                    `
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />

                  <span>{item.label}</span>
                </div>

                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-1 ml-4 space-y-1 border-l border-white/5 pl-3">
                  {item.children.map((child) => {
                    const childActive =
                      pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          `
                            block rounded-lg
                            px-3 py-2 text-[12px]
                            transition-all
                          `,
                          childActive
                            ? `
                              bg-primary/15
                              font-medium
                              text-primary
                            `
                            : `
                              text-zinc-400
                              hover:bg-sidebar-secondary
                              hover:text-white
                            `
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              `
                group flex items-center
                gap-2.5 rounded-xl
                px-3 py-2.5 text-[13px]
                font-medium transition-all
              `,
              active
                ? `
                  bg-primary
                  text-sidebar
                  shadow-md
                `
                : `
                  text-zinc-300
                  hover:bg-sidebar-secondary
                  hover:text-white
                `
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />

            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  </div>

  {/* Bottom */}
  <div
    className="
      border-t border-sidebar-border
      p-3
    "
  >
    {/* User */}
    <div
      className="
        mb-3 flex items-center gap-2.5
        rounded-xl border
        border-white/5
        bg-sidebar-secondary p-2.5
      "
    >
      <div
        className="
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-xl bg-primary
          text-xs font-bold text-sidebar
        "
      >
        A
      </div>

      <div className="min-w-0">
        <p
          className="
            truncate text-[13px]
            font-semibold text-white
          "
        >
          Admin User
        </p>

        <p
          className="
            truncate text-[11px]
            text-zinc-400
          "
        >
          admin@logicallinks.com
        </p>
      </div>
    </div>

    {/* Footer */}
    <p
      className="
        mt-3 text-center text-[10px]
        text-zinc-500
      "
    >
      © 2026 Logical Links CMS
    </p>
  </div>
</aside>
    </>
  );
}