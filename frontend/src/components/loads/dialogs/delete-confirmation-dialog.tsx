"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Load } from "@/types/load.types";
import { StatusBadge } from "@/components/loads/status-badge";
import { shipperName } from "@/lib/utils/shipper-name";

export function DeleteConfirmDialog({
  load,
  open,
  onClose,
  onConfirm,
}: {
  load: Load;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md border border-card-border bg-card p-0 shadow-2xl"
        style={{ borderRadius: "var(--radius-md, 16px)" }}
      >
        <DialogHeader className="border-b border-card-border px-7 py-5">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Delete Load
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted">
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 py-6">
          {/* Warning card */}
          <div className="flex gap-3 rounded-[10px] border border-danger/20 bg-danger/5 px-4 py-4">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">
                Delete <span className="font-bold">{load.loadNumber}</span>?
              </p>
              <p className="mt-1 text-sm text-muted">
                Shipper: {shipperName(load.shipperId)} · Status:{" "}
                <StatusBadge status={load.status} />
              </p>
              <p className="mt-2 text-sm text-muted">
                Once deleted this load will be permanently removed from the
                system.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-[10px] border-card-border text-foreground hover:bg-background"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="rounded-[10px] bg-danger px-6 text-white hover:bg-danger/85"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Yes, Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}