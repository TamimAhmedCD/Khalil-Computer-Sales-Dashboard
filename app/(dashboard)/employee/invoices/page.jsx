import InvoiceList from "@/components/invoice/InvoiceList";

export const metadata = {
  title: "Invoices | Employee",
  description: "Manage your invoices",
};

export default function EmployeeInvoicesPage() {
  return <InvoiceList basePath="/employee" />;
}
