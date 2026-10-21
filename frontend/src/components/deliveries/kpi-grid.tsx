import {  } from "lucide-react";
import { KpiCard, type KpiDataPoint } from "@/components/deliveries/kpi-card";
import { DashboardIcons } from "@/components/ui/dashboard-icons";

const kpiItems = [
  { title: "Total Deliveries",  key: "total",      icon: DashboardIcons.totalDeliveries,          chartColor: "#C89B3C" },
  { title: "In Transit",   key: "transit",     icon: DashboardIcons.inTransit,         chartColor: "#3B82F6" },
  { title: "Delivered",    key: "delivered",   icon: DashboardIcons.deliveredTransit,   chartColor: "#10B981" },
  { title: "Exceptions",   key: "exceptions",  icon: DashboardIcons.exceptions,  chartColor: "#EF4444" },
];

interface KpiGridStats {
  total:      number;
  transit:    number;
  delivered:  number;
  exceptions: number;
}

interface SparklineData {
  total?:      KpiDataPoint[];
  transit?:    KpiDataPoint[];
  delivered?:  KpiDataPoint[];
  exceptions?: KpiDataPoint[];
}

interface GrowthData {
  total?:      { pct: string; direction: "up" | "down" };
  transit?:    { pct: string; direction: "up" | "down" };
  delivered?:  { pct: string; direction: "up" | "down" };
  exceptions?: { pct: string; direction: "up" | "down" };
}

interface KpiGridProps {
  stats:      KpiGridStats;
  isLoading?: boolean;
  sparklines?: SparklineData;
  growth?:    GrowthData;
}

export default function KpiGrid({ stats, isLoading = false, sparklines, growth }: KpiGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-4 xl:grid-cols-4">
      {kpiItems.map((item) => {
        const key = item.key as keyof KpiGridStats;
        const g   = growth?.[key];
        return (
          <KpiCard
            key={item.key}
            title={item.title}
            value={stats[key]}
            icon={item.icon}
            chartColor={item.chartColor}
            isLoading={isLoading}
            data={sparklines?.[key]}
            growth={g?.pct}
            trend={g?.direction}
          />
        );
      })}
    </div>
  );
}
