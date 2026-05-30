// "use client";

// import { useMemo, useState } from "react";
// import {
//   getCoreRowModel,
//   getPaginationRowModel,
//   useReactTable,
// } from "@tanstack/react-table";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
// import {
//   Plus,
//   ShieldAlert,
//   User,
// } from "lucide-react";
// import { Load } from "@/types/load.types";
// import { LoadFormValues } from "@/lib/validations/load";
// import { useLoadStore } from "@/store/load.store";
// import { shipperName } from "@/lib/utils/shipper-name";
// import KpiGrid from "@/components/loads/kpi-grid";
// import { getLoadColumns } from "@/components/loads/columns";
// import { LoadDialog } from "@/components/loads/dialogs/load-dialog";
// import { DeleteConfirmDialog } from "@/components/loads/dialogs/delete-confirmation-dialog";
// import { ViewLoadDialog } from "@/components/loads/dialogs/view-load-dialog";
// import { DataTable } from "@/components/loads/loads-table";

// export default function LoadsPage() {
//   const {
//     loads,
//     addLoad,
//     updateLoad,
//     deleteLoad,
//     currentRole,
//     currentShipperId,
//   } = useLoadStore();

//   const isAdmin = currentRole === "admin";

//   const [viewingLoad, setViewingLoad] = useState<Load | null>(null);
//   const [editingLoad, setEditingLoad] = useState<Load | null>(null);
//   const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [search, setSearch] = useState("");

//   /* Visible loads based on role */
//   const visibleLoads = useMemo(() => {
//   // ADMIN
//   if (isAdmin) {
//     // Admin can only see public loads
//     return loads.filter((load) => !load.isPrivate);
//   }

//   // SHIPPER
//   return loads.filter((load) => {
//     const isAssignedToShipper =
//       load.shipperId === currentShipperId;

//     const isCreatedByShipper =
//       load.createdBy === currentShipperId;

//     return isAssignedToShipper || isCreatedByShipper;
//   });
// }, [loads, isAdmin, currentShipperId]);

//   /* KPIs */
//   const stats = useMemo(
//     () => ({
//       total: visibleLoads.length,
//       transit: visibleLoads.filter((l) => l.status === "In Transit").length,
//       delivered: visibleLoads.filter((l) => l.status === "Delivered").length,
//       exceptions: visibleLoads.filter((l) => l.status === "Cancelled").length,
//     }),
//     [visibleLoads],
//   );

//   /* Filtered */
//   const filtered = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return visibleLoads;
//     return visibleLoads.filter(
//       (l) =>
//         l.loadNumber.toLowerCase().includes(q) ||
//         shipperName(l.shipperId).toLowerCase().includes(q) ||
//         l.origin.toLowerCase().includes(q) ||
//         l.destination.toLowerCase().includes(q),
//     );
//   }, [visibleLoads, search]);

//   /* Permission helpers */
//   function canEdit(load: Load) {
//     if (!isAdmin) return load.shipperId === currentShipperId;
//     return !load.isPrivate; // admin cannot edit shipper-private loads
//   }

//   function canDelete(load: Load) {
//     if (!isAdmin) return false;
//     return load.status !== "Delivered" && !load.isPrivate;
//   }

//   /* Columns */
//   const columns = useMemo(
//     () =>
//       getLoadColumns({
//         isAdmin,

//         canEdit,
//         canDelete,

//         onEdit: (load) => setEditingLoad(load),
//         onDelete: (load) => setDeletingLoad(load),
//       }),
//     [isAdmin, currentShipperId],
//   );

//   const table = useReactTable({
//     data: filtered,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     initialState: { pagination: { pageSize: 5 } },
//   });

//   /* Handlers */
//   function handleCreate(values: LoadFormValues) {
//     addLoad({
//       id: String(Date.now()),
//       ...values,
//       createdBy: currentShipperId,
//       createdAt: new Date().toISOString(),
//       isPrivate: !isAdmin, // shipper-created loads are always private
//     });
//     toast.success("Load created successfully");
//     setCreateOpen(false);
//   }

//   function handleUpdate(values: LoadFormValues) {
//     if (!editingLoad) return;
//     updateLoad(editingLoad.id, { ...editingLoad, ...values });
//     toast.success("Load updated successfully");
//     setEditingLoad(null);
//   }

//   function handleDelete() {
//     if (!deletingLoad) return;
//     deleteLoad(deletingLoad.id);
//     toast.success(`Load ${deletingLoad.loadNumber} deleted`);
//     setDeletingLoad(null);
//   }

//   function handleEditFromView(load: Load) {
//     setViewingLoad(null);
//     setTimeout(() => setEditingLoad(load), 150);
//   }

//   return (
//     <div className="min-h-screen bg-background p-6 lg:p-8">
//       <div className="mx-auto max-w-7xl space-y-7">
//         {/* ── HEADER ── */}
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
//           <div>
//             <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
//               Operations
//             </p>
//             <h1
//               className="mt-2 font-bold text-foreground"
//               style={{ fontSize: "2.6rem", lineHeight: 1.1 }}
//             >
//               Manage Loads
//             </h1>
//             <p className="mt-2 text-sm text-muted">
//               Manage load operations and shipment workflows.
//             </p>
//           </div>

//           <div className="flex items-center gap-3">
//             <Button
//               onClick={() => setCreateOpen(true)}
//               className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-sidebar hover:bg-primary/85"
//             >
//               <Plus className="h-4 w-4" />
//               Create Load
//             </Button>
//           </div>
//         </div>

//         {/* Role indicator */}
//         <div
//           className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm ${
//             isAdmin
//               ? "border-info/20 bg-info/5 text-blue-700"
//               : "border-warning/20 bg-warning/5 text-yellow-700"
//           }`}
//         >
//           {isAdmin ? (
//             <ShieldAlert className="h-4 w-4 shrink-0" />
//           ) : (
//             <User className="h-4 w-4 shrink-0" />
//           )}
//           <span className="font-medium">
//             {isAdmin
//               ? "Viewing as Admin — private shipper loads are hidden · delivered loads cannot be deleted"
//               : `Viewing as ${shipperName(currentShipperId)} — your private loads are visible only to you`}
//           </span>
//         </div>

//         {/* ── KPI CARDS ── */}
//         <KpiGrid stats={stats} />

//         {/* ── TABLE CARD ── */}
//         <DataTable<Load>
//           title="Loads Management"
//           columns={columns}
//           data={filtered}
//           searchValue={search}
//           onSearchChange={setSearch}
//           searchPlaceholder="Search loads…"
//           onRowClick={setViewingLoad}
//           pageSize={10}
//           headerActions={
//             // secondary action slot — e.g. export button
//             undefined
//           }
//           emptyState={
//             <span className="text-muted">
//               No loads match your search.
//             </span>
//           }
//         />
//       </div>

//       {/* ── VIEW MODAL ── */}
//       {viewingLoad && (
//         <ViewLoadDialog
//           load={viewingLoad}
//           open={!!viewingLoad}
//           onClose={() => setViewingLoad(null)}
//           canEdit={canEdit(viewingLoad)}
//           onEdit={() => handleEditFromView(viewingLoad)}
//         />
//       )}

//       {/* ── CREATE DIALOG ── */}
//       <LoadDialog
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         title="Create Load"
//         description={
//           isAdmin
//             ? "Fill in the details to create a new shipment load."
//             : "Create a private load — visible only to you."
//         }
//         isAdmin={isAdmin}
//         onSubmit={handleCreate}
//       />

//       {/* ── EDIT DIALOG ── */}
//       {editingLoad && (
//         <LoadDialog
//           open={!!editingLoad}
//           onClose={() => setEditingLoad(null)}
//           title="Edit Load"
//           description="Update the shipment and load details below."
//           defaultValues={editingLoad}
//           isAdmin={isAdmin}
//           onSubmit={handleUpdate}
//         />
//       )}

//       {/* ── DELETE CONFIRM ── */}
//       {deletingLoad && (
//         <DeleteConfirmDialog
//           load={deletingLoad}
//           open={!!deletingLoad}
//           onClose={() => setDeletingLoad(null)}
//           onConfirm={handleDelete}
//         />
//       )}
//     </div>
//   );
// }











import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoadsPage from "@/components/loads/load-page";

export default async function ShipperPage() {
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();

  // if (!user) redirect("/login");

  // // Guard: only allow shippers to reach this route
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single();

  // if (profile?.role !== "shipper") redirect("/dashboard/admin");

  return <LoadsPage />;
}