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
    title: 'Shipments',
    value: '1,248',
    growth: '+12%',
    icon: Package,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Revenue',
    value: '$284K',
    growth: '+6%',
    icon: CircleDollarSign,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Loads',
    value: '312',
    growth: '+8%',
    icon: Truck,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Customers',
    value: '94',
    growth: '+4%',
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
  },
]

const recentShipments = [
  {
    id: 'LL12345678',
    origin: 'Toronto',
    destination: 'Chicago',
    status: 'Transit',
    eta: 'May 22',
  },
  {
    id: 'LL12345679',
    origin: 'Mississauga',
    destination: 'New York',
    status: 'Delivered',
    eta: 'May 20',
  },
  {
    id: 'LL12345680',
    origin: 'Montreal',
    destination: 'Dallas',
    status: 'Pending',
    eta: 'May 25',
  },
]

const notifications = [
  {
    title: 'Shipment Delayed',
    desc: 'Load delayed due to weather.',
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
    desc: 'Shipment delivered successfully.',
    color: 'bg-green-100 text-green-600',
    icon: Package,
  },
]

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-5">
      <div className="mx-auto max-w-400 space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              Welcome back, Imtiaz
            </h1>

            <p className="mt-1 text-sm text-muted">
              Logistics overview & shipment performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="
                relative flex h-10 w-10 items-center
                justify-center rounded-2xl
                border border-card-border
                bg-card transition hover:bg-zinc-50
              "
            >
              <Bell className="h-4 w-4 text-zinc-600" />

              <span
                className="
                  absolute right-2 top-2
                  h-2 w-2 rounded-full bg-primary
                "
              />
            </button>

            <div
              className="
                rounded-2xl border border-card-border
                bg-card px-4 py-2.5
              "
            >
              <p className="text-xs text-muted">
                May 20 — May 26, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {stats.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className="
                  rounded-3xl border border-card-border
                  bg-card p-5 shadow-sm
                "
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">
                      {item.title}
                    </p>

                    <h2
                      className="
                        mt-2 text-2xl
                        font-bold text-foreground
                      "
                    >
                      {item.value}
                    </h2>

                    <div
                      className="
                        mt-2 flex items-center gap-1
                        text-xs text-emerald-600
                      "
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      {item.growth}
                    </div>
                  </div>

                  <div
                    className={`
                      flex h-11 w-11 items-center
                      justify-center rounded-2xl
                      ${item.color}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Grid */}
        <div
          className="
            grid grid-cols-1 gap-5
            2xl:grid-cols-[1.6fr_0.8fr]
          "
        >
          {/* Recent Shipments */}
          <div
            className="
              overflow-hidden rounded-3xl
              border border-card-border
              bg-card shadow-sm
            "
          >
            <div
              className="
                flex items-center justify-between
                border-b border-card-border
                px-5 py-4
              "
            >
              <div>
                <h3
                  className="
                    text-base font-semibold
                    text-foreground
                  "
                >
                  Recent Shipments
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Latest freight activity
                </p>
              </div>

              <Link
                href="/admin/shipments"
                className="
                  flex items-center gap-1
                  text-sm font-medium text-primary
                "
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    {[
                      'Tracking',
                      'Origin',
                      'Destination',
                      'Status',
                      'ETA',
                    ].map((head) => (
                      <th
                        key={head}
                        className="
                          px-5 py-3 text-left
                          text-[11px] font-semibold
                          uppercase tracking-wider
                          text-muted
                        "
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {recentShipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="
                        border-t border-card-border
                        hover:bg-zinc-50/50
                      "
                    >
                      <td
                        className="
                          px-5 py-4 text-sm
                          font-semibold text-primary
                        "
                      >
                        {shipment.id}
                      </td>

                      <td className="px-5 py-4 text-sm text-foreground">
                        {shipment.origin}
                      </td>

                      <td className="px-5 py-4 text-sm text-foreground">
                        {shipment.destination}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            inline-flex rounded-full
                            bg-blue-50 px-2.5 py-1
                            text-[11px] font-medium
                            text-blue-700
                          "
                        >
                          {shipment.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-muted">
                        {shipment.eta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Cards */}
          <div className="space-y-5">
            {/* Tracking */}
            <div
              className="
                overflow-hidden rounded-3xl
                border border-card-border
                bg-card shadow-sm
              "
            >
              <div
                className="
                  flex items-center justify-between
                  border-b border-card-border
                  px-5 py-4
                "
              >
                <div>
                  <h3
                    className="
                      text-base font-semibold
                      text-foreground
                    "
                  >
                    Live Tracking
                  </h3>

                  <p className="mt-1 text-xs text-muted">
                    Real-time visibility
                  </p>
                </div>

                <MapPinned className="h-5 w-5 text-primary" />
              </div>

              <div
                className="
                  flex h-60 items-center
                  justify-center bg-zinc-100
                "
              >
                <div className="text-center">
                  <MapPinned className="mx-auto h-10 w-10 text-primary" />

                  <p className="mt-3 text-xs text-muted">
                    Shipment Map
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div
              className="
                rounded-3xl border border-card-border
                bg-card p-5 shadow-sm
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="
                      text-base font-semibold
                      text-foreground
                    "
                  >
                    Notifications
                  </h3>

                  <p className="mt-1 text-xs text-muted">
                    Latest updates
                  </p>
                </div>

                <Bell className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-5 space-y-3">
                {notifications.map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.title}
                      className="
                        flex items-start gap-3
                        rounded-2xl border
                        border-card-border p-3
                      "
                    >
                      <div
                        className={`
                          flex h-9 w-9 items-center
                          justify-center rounded-xl
                          ${item.color}
                        `}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div>
                        <h4
                          className="
                            text-sm font-semibold
                            text-foreground
                          "
                        >
                          {item.title}
                        </h4>

                        <p
                          className="
                            mt-1 text-xs
                            leading-5 text-muted
                          "
                        >
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

        {/* Bottom Grid */}
        <div
          className="
            grid grid-cols-1 gap-5
            lg:grid-cols-2
          "
        >
          {/* Delivery */}
          <div
            className="
              rounded-3xl border border-card-border
              bg-card p-5 shadow-sm
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="
                    text-base font-semibold
                    text-foreground
                  "
                >
                  On-Time Delivery
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Weekly performance
                </p>
              </div>

              <Clock3 className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-6">
              <h2
                className="
                  text-4xl font-bold
                  text-foreground
                "
              >
                98.6%
              </h2>

              <div
                className="
                  mt-2 flex items-center gap-1
                  text-xs text-emerald-600
                "
              >
                <TrendingUp className="h-3.5 w-3.5" />
                +2.1% from last week
              </div>
            </div>

            <div
              className="
                mt-6 h-2 overflow-hidden
                rounded-full bg-zinc-100
              "
            >
              <div
                className="
                  h-full w-[98%]
                  rounded-full bg-primary
                "
              />
            </div>
          </div>

          {/* Top Lanes */}
          <div
            className="
              rounded-3xl border border-card-border
              bg-card p-5 shadow-sm
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="
                    text-base font-semibold
                    text-foreground
                  "
                >
                  Top Lanes
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Highest shipment volume
                </p>
              </div>

              <Truck className="h-5 w-5 text-primary" />
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

                    <span
                      className="
                        text-sm font-semibold
                        text-primary
                      "
                    >
                      {140 - i * 24}
                    </span>
                  </div>

                  <div
                    className="
                      h-2 overflow-hidden
                      rounded-full bg-zinc-100
                    "
                  >
                    <div
                      className="
                        h-full rounded-full
                        bg-primary
                      "
                      style={{
                        width: `${90 - i * 18}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}