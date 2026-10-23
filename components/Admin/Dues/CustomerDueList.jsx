"use client";

import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  DollarSign,
  History,
  Phone,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnifiedSelect } from "@/components/ui/UnifiedSelect";
import { useDueCustomers } from "@/lib/hooks/dues/useDueCustomers";
import { useCollectDue } from "@/lib/hooks/dues/useCollectDue";
import { Skeleton } from "@/components/ui/skeleton";
import CollectDueModal from "@/components/Admin/Dues/CollectDueModal";
import CustomerDueDetail from "@/components/Admin/Dues/CustomerDueDetail";

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const formatDate = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CustomerDueList({ session }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("outstanding");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useDueCustomers({
    search,
    status,
    page: currentPage,
  });

  const customers = data?.data?.customers || [];
  const pagination = data?.data?.pagination || {
    page: 1,
    totalPages: 1,
    totalCustomers: 0,
  };

  const handleOpenCollect = useCallback((customer) => {
    setSelectedCustomer(customer);
    setCollectModalOpen(true);
  }, []);

  const handleOpenDetail = useCallback((customer) => {
    setSelectedCustomer(customer);
    setDetailModalOpen(true);
  }, []);

  const queryClient = useQueryClient();

  const handleCollectSuccess = useCallback(
    async (result) => {
      setCollectModalOpen(false);
      setSelectedCustomer(null);

      // Invalidate all due-related queries to refetch fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dueCustomers"] }),
        queryClient.invalidateQueries({ queryKey: ["dueDashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["customerDueDetail"] }),
        queryClient.invalidateQueries({ queryKey: ["dueCollections"] }),
      ]);
    },
    [queryClient]
  );

  const showingFrom =
    pagination.totalCustomers === 0
      ? 0
      : (currentPage - 1) * 10 + 1;
  const showingTo = Math.min(currentPage * 10, pagination.totalCustomers);

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), pagination.totalPages);
    setCurrentPage(safePage);
  };

  return (
    <>
      <div className="p-5 space-y-4">
        {/* =====================================================
            FILTERS
        ====================================================== */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Search Customers
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, phone, or invoice..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Payment Status
            </label>
            <UnifiedSelect
              value={status}
              onChange={(value) => {
                setStatus(value);
                setCurrentPage(1);
              }}
              searchable={false}
              items={[
                { id: "all", name: "All Customers" },
                { id: "outstanding", name: "Outstanding Due" },
                { id: "partial", name: "Partial Payment" },
                { id: "paid", name: "Fully Paid" },
              ]}
              placeholder="Select status"
            />
          </div>
        </div>

        {/* =====================================================
            TABLE
        ====================================================== */}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="mt-4 font-semibold">Failed to load customers</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {error?.message || "An error occurred"}
            </p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">No customers found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              No customers match your current search and filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total Purchase</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Outstanding Due</TableHead>
                    <TableHead className="text-center">Last Transaction</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.customerPhone}>
                      {/* Customer Name */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {customer.customerName || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {customer.salesCount || 0} sale(s)
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {customer.customerPhone || "-"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Total Purchase */}
                      <TableCell className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(customer.totalPurchase)}
                        </p>
                      </TableCell>

                      {/* Total Paid */}
                      <TableCell className="text-right">
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(customer.totalPaid)}
                        </p>
                      </TableCell>

                      {/* Outstanding Due */}
                      <TableCell className="text-right">
                        <p
                          className={
                            customer.totalOutstanding > 0
                              ? "font-bold text-orange-600 dark:text-orange-400"
                              : "font-semibold text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {formatCurrency(customer.totalOutstanding)}
                        </p>
                      </TableCell>

                      {/* Last Transaction */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(customer.lastTransaction)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => handleOpenDetail(customer)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {customer.totalOutstanding > 0 && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 gap-1.5"
                              onClick={() => handleOpenCollect(customer)}
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Collect
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* =====================================================
                PAGINATION
            ====================================================== */}
            {pagination.totalCustomers > 0 && (
              <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {showingFrom}
                  </span>
                  {" - "}
                  <span className="font-medium text-foreground">
                    {showingTo}
                  </span>
                  {" of "}
                  <span className="font-medium text-foreground">
                    {pagination.totalCustomers}
                  </span>{" "}
                  customers
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex h-9 min-w-25 items-center justify-center rounded-md border px-3 text-sm">
                    Page{" "}
                    <span className="mx-1 font-semibold">{pagination.page}</span> of{" "}
                    {pagination.totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage >= pagination.totalPages || isLoading}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          MODALS
      ====================================================== */}
      {selectedCustomer && (
        <>
          <CollectDueModal
            customer={selectedCustomer}
            open={collectModalOpen}
            onOpenChange={setCollectModalOpen}
            onSuccess={handleCollectSuccess}
          />
          <CustomerDueDetail
            customer={selectedCustomer}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
          />
        </>
      )}
    </>
  );
}
