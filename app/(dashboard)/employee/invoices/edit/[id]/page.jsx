import InvoiceForm from "@/components/invoice/InvoiceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

export const metadata = {
  title: "Edit Invoice | Employee",
  description: "Edit an existing invoice",
};

export default async function EmployeeEditInvoicePage({ params }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employee/invoices">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Update an existing invoice
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading invoice...</div>}>
        <InvoiceForm mode="edit" invoiceId={id} isEmployee={true} />
      </Suspense>
    </div>
  );
}