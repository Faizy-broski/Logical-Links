import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import RoleInitializer from "@/components/layout/role-initializer";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const supabase = await createClient();

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) redirect("/login");

  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single();

  // const role = (profile?.role as "admin" | "shipper") ?? "shipper";

  const role = "shipper";
  const user = { id: "1238712938" };

  return (
    <DashboardShell>
      {/* Seeds Zustand store once on mount — renders nothing */}
      <RoleInitializer role={role} shipperId={user.id} />
      {children}
    </DashboardShell>
  );
}