"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import CustomerDetail from "@/components/Admin/Customers/CustomerDetail";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { User, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeCustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ----- Hooks (always in same order, unconditional) -----
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin/customers", customerSearch],
    queryFn: async () => {
      const response = await axios.get(
        `/api/admin/customers?search=${encodeURIComponent(customerSearch)}&limit=20`
      );
      return response.data;
    },
    staleTime: 5000,
  });

  const customers = useMemo(() => data?.data?.customers || [], [data]);

  const handleCustomerSelect = (customer) => {
    toast.success(`Selected customer: ${customer.customerName}`);
  };

  // ----- Auth / redirect checks -----
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) router.push("/auth/login");
    else if (!["admin", "superAdmin", "employee"].includes(session.user.role))
      router.push("/employee/dashboard");
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading customer management...</p>
      </div>
    );
  }

  if (!session?.user?.id) return null;
  if (!["admin", "superAdmin", "employee"].includes(session.user.role)) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Management</h1>

      <div className="mb-6">
        <Input
          placeholder="Search customers..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-border px-3 text-sm"
          autoComplete="off"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-muted-foreground mb-4">No customers found.</p>
      ) : null}

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {!isLoading && customers.map((customer) => (
          <div
            key={customer.customerPhone || customer._id}
            className="p-3 rounded-lg border border-border hover:bg-accent/5 dark:hover:bg-accent/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor">
                  <path d="M12 15v2m0 0v2m0-2h2m-2 0H9m3 0a9 9 0 110-18 9 9 0 010 18z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{customer.customerName || "Unknown"}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Due ৳{customer.totalOutstanding || 0}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>Phone: {customer.customerPhone}</span>
                  <span>Sales: {customer.salesCount || 0}</span>
                  <span>Total: ৳{customer.totalPurchase || 0}</span>
                  <span>Paid: ৳{customer.totalPaid || 0}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Last: {customer.lastTransaction ? new Date(customer.lastTransaction).toLocaleDateString() : "N/A"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setDetailOpen(true);
                  }}
                  className="px-2.5 py-1 text-[10px] font-medium text-foreground rounded bg-secondary hover:bg-secondary/80"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleCustomerSelect(customer)}
                  className="px-2.5 py-1 text-[10px] font-medium text-primary rounded bg-primary/10 hover:bg-primary/20"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!customers.length && customerSearch && (
        <p className="text-sm text-muted-foreground">No customers match your search.</p>
      )}

      {/* Customer Detail Modal */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Details
            </SheetTitle>
            <SheetDescription>
              Full profile and transaction history
            </SheetDescription>
          </SheetHeader>
          {selectedCustomer && (
            <CustomerDetail customer={selectedCustomer} onClose={() => setDetailOpen(false)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
