import InvoiceForm from "@/components/invoice/InvoiceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

export const metadata = {
  title: "Create Invoice | Admin",
  description: "Create a new invoice",
};

export default function AdminAddInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/invoices">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Generate a new standalone invoice
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading form...</div>}>
        <InvoiceForm mode="create" />
      </Suspense>
    </div>
  );
}
