"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  growth?: string;
  subtitle?: string;
  chartColor?: string;
  data?: { value: number }[];
}

const defaultData = [
  { value: 12 },
  { value: 18 },
  { value: 15 },
  { value: 24 },
  { value: 20 },
  { value: 32 },
  { value: 28 },
  { value: 36 },
];

export function KpiCard({
  title,
  value,
  icon,
  growth = "+12.5%",
  subtitle = "vs last week",
  chartColor = "#C89B3C",
  data = defaultData,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-[#EAE7E1]",
        "bg-white shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl"
      )}
      style={{
        borderRadius: "22px",
      }}
    >
      {/* glow */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#C89B3C]/10 blur-3xl transition-all duration-500 group-hover:bg-[#C89B3C]/20" />

      <CardContent className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              {title}
            </p>

            <div className="mt-3 flex items-end gap-3">
              <h2
                className="font-semibold tracking-tight text-[#171717]"
                style={{
                  fontSize: "2.3rem",
                  lineHeight: 1,
                  fontFamily: "var(--font-cormorant, serif)",
                }}
              >
                {typeof value === "number"
                  ? value.toLocaleString()
                  : value}
              </h2>

              <span className="mb-1 text-sm font-semibold text-emerald-600">
                ↑ {growth}
              </span>
            </div>

            <p className="mt-2 text-xs text-neutral-400">
              {subtitle}
            </p>
          </div>

          {/* Icon */}
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center",
              "rounded-2xl border border-[#C89B3C]/10",
              "bg-[#C89B3C]/5 text-[#C89B3C]",
              "shadow-sm backdrop-blur-sm"
            )}
          >
            {icon}
          </div>
        </div>

        {/* Chart */}
        <div className="mt-6 h-17.5 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id={`gradient-${title}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={chartColor}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <Tooltip
                cursor={false}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #eee",
                  fontSize: 12,
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={3}
                fill={`url(#gradient-${title})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: chartColor,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}