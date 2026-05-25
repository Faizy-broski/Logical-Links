import { ColumnDef } from "@tanstack/react-table";
import { Load } from "@/types/load.types";

import { Lock, MoreHorizontal, Pencil } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/loads/status-badge";
import { shipperName } from "@/lib/utils/shipper-name";
import { formatDate } from "@/lib/utils/format-date";

type ColumnsOptions = {
  canEdit: (load: Load) => boolean;
  canDelete: (load: Load) => boolean;
  onEdit: (load: Load) => void;
  onDelete: (load: Load) => void;
  isAdmin: boolean;
};

export function getLoadColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isAdmin,
}: ColumnsOptions): ColumnDef<Load>[] {
  return [
    {
      accessorKey: "loadNumber",
      header: "Load Number",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">
            {row.original.loadNumber}
          </span>

          {row.original.isPrivate && (
            <span title="Private load">
              <Lock className="h-3 w-3 text-muted" />
            </span>
          )}
        </div>
      ),
    },

    {
      accessorKey: "shipperId",
      header: "Shipper",
      cell: ({ row }) => (
        <span>{shipperName(row.original.shipperId)}</span>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} />
      ),
    },

    {
      accessorKey: "serviceType",
      header: "Service Type",
    },

    {
      accessorKey: "mode",
      header: "Mode",
    },

    {
      accessorKey: "origin",
      header: "Origin",
    },

    {
      accessorKey: "destination",
      header: "Destination",
    },

    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted text-xs">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },

    {
  id: "actions",
  header: "Actions",

  cell: ({ row }) => {
    const load = row.original;

    const editable = canEdit(load);
    const deletable = canDelete(load);

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 border-card-border bg-transparent text-foreground hover:bg-background"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="border border-card-border bg-card shadow-md"
          >
            {/* EDIT */}
            {editable ? (
              <DropdownMenuItem
                onClick={() => onEdit(load)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Load
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled
                className="cursor-not-allowed opacity-60"
              >
                <Lock className="mr-2 h-4 w-4" />
                Cannot Edit
              </DropdownMenuItem>
            )}

            {/* DELETE */}
            {isAdmin && (
              <DropdownMenuItem
                disabled={!deletable}
                onClick={() => deletable && onDelete(load)}
                className={`cursor-pointer ${
                  deletable
                    ? "text-red-600 focus:text-red-600"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <Trash2 className="mr-2 h-4 w-4" />

                {deletable
                  ? "Delete Load"
                  : "Cannot Delete"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
}
  ];
}