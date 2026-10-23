"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  User,
  Phone,
  DollarSign,
  Calendar,
  MoreVertical,
  Eye,
  Receipt,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import CustomerDetail from "@/components/Admin/Customers/CustomerDetail";
import { toast } from "sonner";

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

const formatDateFull = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Customer List Component
export function CustomerList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customers", { search, status, page, limit }],
    queryFn: ({ queryKey }) => fetchCustomers(queryKey[1]),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const customers = data?.data?.customers || [];
  const pagination = data?.data?.pagination || {};

  const fetchCustomers = async (filters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await fetch(`/api/admin/customers?${params.toString()}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to fetch customers");
    }
    return response.json();
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const getStatusBadge = (outstanding) => {
    if (outstanding === 0) {
      return <Badge variant="outline" className="text-emerald-600 border-emerald-200">Paid</Badge>;
    }
    if (outstanding > 0 && outstanding < 1000) {
      return <Badge variant="secondary" className="text-orange-600 bg-orange-50">Small Due</Badge>;
    }
    return <Badge variant="destructive" className="bg-red-50">Has Due</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-8 w-8 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-10 w-full rounded bg-muted" />
                <div className="h-10 w-full rounded bg-muted" />
                <div className="h-10 w-full rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
          <svg
            className="h-6 w-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mt-4 font-semibold">Failed to load customers</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message || "An error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or invoice..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="active">Active (Last 90 Days)</SelectItem>
              <SelectItem value="inactive">Inactive (90+ Days)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                View all customer records and their transaction history
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {pagination.totalCustomers || 0} customers
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Total Purchase</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <User className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No customers found
                        </p>
                        {search && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your search terms
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.customerPhone}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{customer.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.salesCount} invoice(s)
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.customerPhone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.totalPurchase)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            customer.totalOutstanding > 0
                              ? "font-semibold text-orange-600 dark:text-orange-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {formatCurrency(customer.totalOutstanding)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(customer.lastTransaction)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(customer.totalOutstanding)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {customers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalCustomers)}
                </span>{" "}
                of {pagination.totalCustomers} customers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Details
            </SheetTitle>
            <SheetDescription>
              Complete customer profile and transaction history
            </SheetDescription>
          </SheetHeader>
          {selectedCustomer && (
            <CustomerDetail customer={selectedCustomer} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
