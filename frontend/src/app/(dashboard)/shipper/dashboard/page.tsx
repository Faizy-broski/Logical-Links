'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  Bell,
  CircleDollarSign,
  Clock3,
  Package,
  TrendingUp,
  Truck,
  Users,
  MapPinned,
  AlertTriangle,
} from 'lucide-react'

const stats = [
  {
    title: 'Total Shipments',
    value: '1,248',
    growth: '+12.5%',
    icon: Package,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Revenue',
    value: '$284,650',
    growth: '+6.7%',
    icon: CircleDollarSign,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Active Loads',
    value: '312',
    growth: '+8.3%',
    icon: Truck,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Customers',
    value: '94',
    growth: '+4.1%',
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
  },
]

const recentShipments = [
  {
    id: 'LL12345678',
    origin: 'Toronto, ON',
    destination: 'Chicago, IL',
    status: 'In Transit',
    eta: 'May 22, 10:30 AM',
  },
  {
    id: 'LL12345679',
    origin: 'Mississauga, ON',
    destination: 'New York, NY',
    status: 'Delivered',
    eta: 'May 20, 11:45 AM',
  },
  {
    id: 'LL12345680',
    origin: 'Montreal, QC',
    destination: 'Dallas, TX',
    status: 'Pending',
    eta: 'May 25, 03:10 PM',
  },
]

const notifications = [
  {
    title: 'Shipment Delayed',
    desc: 'Load LL12345682 delayed due to weather.',
    color: 'bg-red-100 text-red-600',
    icon: AlertTriangle,
  },
  {
    title: 'New Booking',
    desc: 'New shipment booking received.',
    color: 'bg-blue-100 text-blue-600',
    icon: Bell,
  },
  {
    title: 'Load Delivered',
    desc: 'Shipment LL12345679 delivered successfully.',
    color: 'bg-green-100 text-green-600',
    icon: Package,
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Welcome back, Imtiaz
          </h1>

          <p className="text-sm text-muted mt-2">
            Here&apos;s what&apos;s happening with your logistics operations today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative w-11 h-11 rounded-xl border border-card-border bg-card flex items-center justify-center hover:bg-zinc-50 transition">
            <Bell className="w-5 h-5 text-zinc-600" />

            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          </button>

          <div className="rounded-xl border border-card-border bg-card px-4 py-3">
            <p className="text-xs text-muted">
              May 20 — May 26, 2026
            </p>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="
                rounded-3xl
                border border-card-border
                bg-card
                p-6
                shadow-sm
                hover:shadow-md
                transition-all
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">
                    {item.title}
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-foreground">
                    {item.value}
                  </h2>

                  <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                    {item.growth}
                  </div>
                </div>

                <div
                  className={`
                    flex h-12 w-12 items-center justify-center rounded-2xl
                    ${item.color}
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent Shipments */}
        <div className="xl:col-span-2 rounded-3xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-card-border px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Recent Shipments
              </h3>

              <p className="text-sm text-muted mt-1">
                Latest freight activities
              </p>
            </div>

            <Link
              href="/admin/shipments"
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Tracking #
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Origin
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Destination
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    ETA
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="border-t border-card-border hover:bg-zinc-50/50 transition"
                  >
                    <td className="px-6 py-5 text-sm font-semibold text-primary">
                      {shipment.id}
                    </td>

                    <td className="px-6 py-5 text-sm text-foreground">
                      {shipment.origin}
                    </td>

                    <td className="px-6 py-5 text-sm text-foreground">
                      {shipment.destination}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className="
                          inline-flex rounded-full
                          bg-blue-50 px-3 py-1
                          text-xs font-medium text-blue-700
                        "
                      >
                        {shipment.status}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-muted">
                      {shipment.eta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipment Map */}
        <div className="rounded-3xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-card-border px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Live Tracking
              </h3>

              <p className="text-sm text-muted mt-1">
                Real-time shipment visibility
              </p>
            </div>

            <MapPinned className="w-5 h-5 text-primary" />
          </div>

          <div
            className="
              flex h-95 items-center justify-center
              bg-zinc-100
            "
          >
            <div className="text-center">
              <MapPinned className="mx-auto w-12 h-12 text-primary" />

              <p className="mt-3 text-sm text-muted">
                Shipment Map Placeholder
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Analytics */}
        <div className="rounded-3xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                On-Time Delivery
              </h3>

              <p className="text-sm text-muted mt-1">
                Weekly performance
              </p>
            </div>

            <Clock3 className="w-5 h-5 text-primary" />
          </div>

          <div className="mt-8">
            <h2 className="text-5xl font-bold text-foreground">
              98.6%
            </h2>

            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              +2.1% from last week
            </div>
          </div>

          <div className="mt-8 h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full w-[98%] rounded-full bg-primary" />
          </div>
        </div>

        {/* Top Lanes */}
        <div className="rounded-3xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Top Lanes
              </h3>

              <p className="text-sm text-muted mt-1">
                Highest shipment volume
              </p>
            </div>

            <Truck className="w-5 h-5 text-primary" />
          </div>

          <div className="mt-6 space-y-5">
            {[
              'Toronto → Chicago',
              'Vancouver → LA',
              'Montreal → Dallas',
            ].map((lane, i) => (
              <div key={lane}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    {lane}
                  </span>

                  <span className="text-sm font-semibold text-primary">
                    {140 - i * 24}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${90 - i * 18}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-3xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Notifications
              </h3>

              <p className="text-sm text-muted mt-1">
                Latest system updates
              </p>
            </div>

            <Bell className="w-5 h-5 text-primary" />
          </div>

          <div className="mt-6 space-y-4">
            {notifications.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="
                    flex items-start gap-4 rounded-2xl
                    border border-card-border
                    p-4
                  "
                >
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-xl
                      ${item.color}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {item.title}
                    </h4>

                    <p className="mt-1 text-xs text-muted">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}