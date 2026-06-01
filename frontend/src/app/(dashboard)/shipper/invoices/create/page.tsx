"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { InvoiceEditor } from "@/components/documents/invoice-editor";
import { useAuthStore } from "@/store/auth.store";

export default function ShipperCreateInvoicePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-card-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted">
            <Link href="/shipper/invoices" className="hover:text-foreground transition-colors">Invoices</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">New Invoice</span>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/shipper/invoices"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-background text-muted transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">New Invoice</h1>
              <p className="text-xs text-muted">Shipper Portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <InvoiceEditor profileId={user.id} redirectTo="/shipper/invoices/[id]" />
      </div>
    </div>
  );
}
