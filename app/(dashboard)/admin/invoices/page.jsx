import InvoiceList from "@/components/invoice/InvoiceList";

export const metadata = {
  title: "Invoices | Admin",
  description: "Manage all invoices",
};

export default function AdminInvoicesPage() {
  return <InvoiceList basePath="/admin" />;
}
