import { Truck, Clock3, CheckCircle2, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/loads/kpi-card";

const kpiItems = [
  {
    title: "Total Loads",
    key: "total",
    icon: Truck,
  },
  {
    title: "In Transit",
    key: "transit",
    icon: Clock3,
  },
  {
    title: "Delivered",
    key: "delivered",
    icon: CheckCircle2,
  },
  {
    title: "Exceptions",
    key: "exceptions",
    icon: AlertTriangle,
  },
];

export default function KpiGrid({ stats }: { stats: any }) {
  return (
    <div className="grid gap-5 sm:grid-cols-4 xl:grid-cols-4">
      {kpiItems.map((item) => (
        <KpiCard
          key={item.key}
          title={item.title}
          value={stats[item.key]}
          icon={item.icon}
        />
      ))}
    </div>
  );
}