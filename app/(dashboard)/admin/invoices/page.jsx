import InvoiceList from "@/components/invoice/InvoiceList";
import { Suspense } from "react";

export const metadata = {
  title: "Invoices | Admin",
  description: "Manage all invoices",
};

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={<div>Loading invoices...</div>}>
      <InvoiceList basePath="/admin" />
    </Suspense>
  );
}
