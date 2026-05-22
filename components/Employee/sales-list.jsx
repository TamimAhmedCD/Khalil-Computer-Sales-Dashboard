'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Edit2, Plus, X, ChevronLeft, ChevronRight, Loader2, Trash } from 'lucide-react';
import Link from 'next/link';
import { useDeleteSale } from '@/lib/hooks/sales/useDeleteSale';
import { toast } from 'sonner';

// Next.js কম্পাইলার ফ্রেন্ডলি পিওর জাভাস্ক্রিপ্ট ফেচিং ফাংশন
const fetchSales = async (context) => {
  const queryKey = context.queryKey;
  const filters = queryKey[1]; // ২য় এলিমেন্ট থেকে ফিল্টার অবজেক্ট নেওয়া হলো
  
  const searchTerm = filters.searchTerm;
  const dateFilter = filters.dateFilter;
  const customStartDate = filters.customStartDate;
  const customEndDate = filters.customEndDate;
  const currentPage = filters.currentPage;

  const params = new URLSearchParams();
  if (searchTerm) params.append('search', searchTerm);
  if (dateFilter) params.append('dateFilter', dateFilter);
  if (dateFilter === 'custom' && customStartDate && customEndDate) {
    params.append('customStartDate', customStartDate);
    params.append('customEndDate', customEndDate);
  }
  params.append('page', currentPage.toString());

  const response = await axios.get('/api/products/sales?' + params.toString());
  return response.data;
};

export function SalesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  // সার্চ টার্ম ডিবান্স করার জন্য
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // TanStack Query কল
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'sales',
      { 
        searchTerm: debouncedSearch, 
        dateFilter: dateFilter, 
        customStartDate: customStartDate, 
        customEndDate: customEndDate, 
        currentPage: currentPage 
      },
    ],
    queryFn: fetchSales,
  });

  // সেফটি ফলব্যাক
  const sales = (data && data.data) || [];
  const summary = (data && data.summary) || { totalSalesAmount: 0, totalProfit: 0, totalCommission: 0 };
  const pagination = (data && data.pagination) || { totalResults: 0, totalPages: 1, currentPage: 1 };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

const [loadingId, setLoadingId] = useState(null);

const handleDelete = async (id) => {
  try {
    setLoadingId(id);

    await axios.delete(`/api/products/sales/${id}`);

    toast.success("Deleted");

    refetch()

  } catch (error) {
    toast.error(error.response?.data?.message || "Delete failed");

  } finally {
    setLoadingId(null);
  }
};

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">My Sales</h1>
          <Link href="/employee/sales">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              Add New Sale
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Sales Amount ({dateFilter})
              </p>
              <p className="text-2xl font-bold text-foreground">
                ৳{summary.totalSalesAmount.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Net Profit ({dateFilter})
              </p>
              <p className="text-2xl font-bold text-foreground">
                ৳{summary.totalProfit.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                My Total Commission ({dateFilter})
              </p>
              <p className="text-2xl font-bold text-primary">
                ৳{summary.totalCommission.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by product name or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-card border-border text-foreground"
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-56 bg-card border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-card border-border text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-card border-border text-foreground"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setDateFilter('today');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setCurrentPage(1);
                }}
                className="border-border text-foreground hover:bg-muted"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Dynamic Status Engine */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading sales data...</p>
          </div>
        ) : isError ? (
          <Card className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 text-center">
            <p className="text-destructive font-semibold">Error loading data</p>
            <p className="text-xs text-muted-foreground mt-1">{error ? error.message : 'Something went wrong'}</p>
          </Card>
        ) : sales.length > 0 ? (
          <Card className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Invoice</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Qty</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Total Price</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
  {sale.createdAt
    ? new Date(sale.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A"}
</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{sale.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-foreground max-w-50 truncate">{sale.productName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                          {sale.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{sale.quantity}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-foreground">
                        ৳{sale.totalPrice ? sale.totalPrice.toLocaleString() : 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="h-4 w-4 text-foreground" />
                          </Button>
                          <Link href={`/employee/sales/edit/${sale._id}`}><Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <Edit2 className="h-4 w-4 text-foreground" />
                          </Button></Link>
<Button
  variant="destructive"
  size="sm"
  className="h-8 w-8 p-0"
  onClick={() => handleDelete(sale._id)}
  disabled={loadingId === sale._id}
>
  {loadingId === sale._id ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Trash className="h-4 w-4" />
  )}
</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * 10 + 1, pagination.totalResults)} to{' '}
                {Math.min(currentPage * 10, pagination.totalResults)} of {pagination.totalResults} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (Math.abs(currentPage - pageNum) <= 2 || pageNum === 1 || pageNum === pagination.totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={currentPage === pageNum ? 'bg-primary text-primary-foreground' : ''}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-card p-12 rounded-lg shadow-sm border border-border text-center">
            <p className="text-muted-foreground mb-4">No sales found</p>
          </Card>
        )}
      </div>

      {/* Details Modal Pop-up */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-card w-full max-w-2xl rounded-lg shadow-lg border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-xl font-bold text-foreground">Sale Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Invoice: {selectedSale.invoiceNumber}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSale(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sale Date & Time</p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedSale.createdAt && selectedSale.createdAt.$date ? new Date(selectedSale.createdAt.$date).toLocaleString('en-US') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Payment Method</p>
                  <p className="text-sm font-semibold text-foreground">{selectedSale.paymentMethod || 'Cash'}</p>
                </div>
              </div>

              {/* Customer & Seller Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Info</h3>
                  <div className="bg-card p-3 rounded-md border border-border space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedSale.customerName || 'N/A'}</span></p>
                    <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedSale.customerPhone || 'N/A'}</span></p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seller Info</h3>
                  <div className="bg-card p-3 rounded-md border border-border space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedSale.sellerName || 'N/A'}</span></p>
                    <p><span className="text-muted-foreground">Seller ID:</span> <span className="font-mono text-xs text-muted-foreground block truncate">{selectedSale.sellerId || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Product Details</h3>
                <div className="grid grid-cols-3 gap-4 bg-muted/20 p-3 rounded-md border border-border">
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Product Name</p>
                    <p className="text-sm font-medium text-foreground">{selectedSale.productName}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">
                      {selectedSale.categoryName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Quantity</p>
                    <p className="text-sm font-bold text-foreground">× {selectedSale.quantity}</p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdowns */}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Financial Summary Breakdown</h3>
                <div className="space-y-3 bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal / Total Price</span>
                    <span className="font-medium text-foreground">৳{selectedSale.totalPrice ? selectedSale.totalPrice.toLocaleString() : 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expense Cost (Per Unit)</span>
                    <span className="font-medium text-destructive">৳{selectedSale.expenseCost ? selectedSale.expenseCost.toLocaleString() : 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Expense</span>
                    <span className="font-medium text-destructive">৳{selectedSale.totalExpense ? selectedSale.totalExpense.toLocaleString() : 0}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-dashed border-border pt-2">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-medium text-green-600">৳{selectedSale.paidAmount ? selectedSale.paidAmount.toLocaleString() : 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Amount</span>
                    <span className={`font-medium ${selectedSale.due > 0 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                      ৳{selectedSale.due ? selectedSale.due.toLocaleString() : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-2">
                    <span className="text-foreground font-medium">Net Profit Generated</span>
                    <span className="font-bold text-foreground">৳{selectedSale.netProfit ? selectedSale.netProfit.toLocaleString() : 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3 bg-primary/5 -mx-4 -mb-4 p-4 rounded-b-lg">
                    <span className="text-primary font-bold text-sm">Your Commission (Earnings)</span>
                    <span className="font-extrabold text-primary text-xl">
                      ৳{selectedSale.commission ? selectedSale.commission.toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>

              {selectedSale.note && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes / Remarks</p>
                  <p className="text-sm p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded border border-amber-200/50">
                    {selectedSale.note}
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-6 flex gap-3">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setSelectedSale(null)}
                >
                  Close View
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}