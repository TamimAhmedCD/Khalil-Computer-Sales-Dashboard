import InvoiceList from "@/components/invoice/InvoiceList";
import { Suspense } from "react";

export const metadata = {
  title: "Invoices | Employee",
  description: "Manage your invoices",
};

export default function EmployeeInvoicesPage() {
  return (
    <Suspense fallback={<div>Loading invoices...</div>}>
      <InvoiceList basePath="/employee" />
    </Suspense>
  );
}
