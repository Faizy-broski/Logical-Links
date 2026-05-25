"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, Navigation, Layers, MapPin, Lock, Pencil, Package, Tag, Calendar } from "lucide-react";
import { Load } from "@/types/load.types";
import { StatusBadge } from "@/components/loads/status-badge";
import { shipperName } from "@/lib/utils/shipper-name";
import { formatDate } from "@/lib/utils/format-date";
import { DetailTile } from "@/components/loads/detail-title";

export function ViewLoadDialog({
  load,
  open,
  onClose,
  canEdit,
  onEdit,
}: {
  load: Load;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const modeIcons = {
    Road: <Truck className="h-4 w-4" />,
    Air: <Navigation className="h-4 w-4" />,
    Rail: <Layers className="h-4 w-4" />,
    Sea: <MapPin className="h-4 w-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg border border-card-border bg-card p-0 shadow-2xl"
        style={{ borderRadius: "var(--radius-md, 16px)" }}
      >
        {/* Header */}
        <DialogHeader className="border-b border-card-border px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Load Details
              </p>
              <DialogTitle
                className="mt-1 font-bold text-foreground"
                style={{
                  fontSize: "1.6rem",
                  lineHeight: 1.15,
                  fontFamily: "var(--font-cormorant, serif)",
                }}
              >
                {load.loadNumber}
              </DialogTitle>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusBadge status={load.status} />
                {load.isPrivate && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-muted-light/30 bg-muted/10 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                    <Lock className="h-2.5 w-2.5" /> Private
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={onEdit}
                className="mt-8 shrink-0 gap-1.5 rounded-[10px] bg-primary px-4 text-xs text-sidebar hover:bg-primary/85"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Route banner */}
        <div className="mx-6 mt-5 flex items-center gap-3 rounded-[10px] border border-card-border bg-background px-5 py-4">
          <div className="flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
              Origin
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {load.origin}
            </p>
          </div>
          <div className="flex flex-1 items-center gap-1">
            <div className="h-px flex-1 bg-card-border" />
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {modeIcons[load.mode]}
            </div>
            <div className="h-px flex-1 bg-card-border" />
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
              Destination
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {load.destination}
            </p>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-7 pt-4">
          <DetailTile
            icon={<Package className="h-4 w-4" />}
            label="Shipper"
            value={shipperName(load.shipperId)}
          />
          <DetailTile
            icon={<Tag className="h-4 w-4" />}
            label="Service Type"
            value={load.serviceType}
          />
          <DetailTile
            icon={modeIcons[load.mode]}
            label="Mode"
            value={load.mode}
          />
          <DetailTile
            icon={<Calendar className="h-4 w-4" />}
            label="Created"
            value={formatDate(load.createdAt)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}