import { Truck, Clock3, CheckCircle2, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/loads/kpi-card";

const kpiItems = [
  {
    title: "Total Loads",
    key: "total",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    title: "In Transit",
    key: "transit",
    icon: <Clock3 className="h-5 w-5" />,
  },
  {
    title: "Delivered",
    key: "delivered",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    title: "Exceptions",
    key: "exceptions",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
];

export default function KpiGrid({ stats }: { stats: any }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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