"use client";

import { useState } from "react";
import { useDueCustomers } from "@/lib/hooks/dues/useDueCustomers";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/finance";
import { Search, Eye, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerDueList({ onSelectCustomer, onCollectDue }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("outstanding");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useDueCustomers({ search, status, page, limit: 10 });
  const customers = data?.data?.customers || [];
  const pagination = data?.data?.pagination || { totalPages: 1 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or invoice..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button size="sm" variant={status === "outstanding" ? "default" : "outline"} onClick={() => setStatus("outstanding")}>
            Outstanding Only
          </Button>
          <Button size="sm" variant={status === "all" ? "default" : "outline"} onClick={() => setStatus("all")}>
            All Customers
          </Button>
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <p className="text-destructive text-center py-4">Failed to load customers</p>}

      {!isLoading && !isError && (
        <div className="border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Total Purchase</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Outstanding Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.customerPhone || c.customerName}>
                  <TableCell className="font-medium">{c.customerName}</TableCell>
                  <TableCell className="text-muted-foreground">{c.customerPhone || "N/A"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.totalPurchase)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatCurrency(c.totalPaid)}</TableCell>
                  <TableCell className="text-right font-bold text-orange-600">{formatCurrency(c.outstandingDue)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onSelectCustomer(c)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button
                        size="sm"
                        disabled={c.outstandingDue <= 0}
                        onClick={() => onCollectDue(c)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1" /> Collect
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No customers with due balances found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
