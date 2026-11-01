"use client";

import { useState } from "react";
import { useDueDashboard } from "@/lib/hooks/dues/useDueDashboard";
import { useQuery } from "@tanstack/react-query";
import CustomerDueList from "./CustomerDueList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils/finance";
import { Wallet, CheckCircle2, TrendingUp, Users, RefreshCw } from "lucide-react";
import CustomerDueList from "./CustomerDueList";
import CollectDueModal from "./CollectDueModal";
import CustomerDueDetail from "./CustomerDueDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function DueDashboard() {
  const { data, isLoading, refetch } = useDueDashboard();
  const summary = data?.data || {};

  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPhone, setDetailPhone] = useState(null);

  const detailQuery = useQuery({
    queryKey: ["customerDueDetail", detailPhone],
    queryFn: () => getCustomerDueDetail(detailPhone),
    enabled: !!detailPhone,
  });

  const handleOpenCollect = (customer, sale = null) => {
    setSelectedCustomer(customer);
    setSelectedSale(sale);
    setCollectModalOpen(true);
  };

  const handleOpenDetail = (customer) => {
    setDetailPhone(customer.customerPhone || customer.customerName);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Due Management</h1>
          <p className="text-sm text-muted-foreground">Track and collect outstanding customer payments.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground font-medium">Total Outstanding Due</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(summary.totalOutstandingDue || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Uncollected balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground font-medium">Collected Today</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(summary.collectedToday || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Received today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground font-medium">Collected This Month</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(summary.collectedThisMonth || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Received this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground font-medium">Customers with Due</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{formatNumber(summary.customersWithDue || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Active debtors</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customers Due List</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerDueList
            onSelectCustomer={handleOpenDetail}
            onCollectDue={(customer) => handleOpenCollect(customer)}
          />
        </CardContent>
      </Card>

      {collectModalOpen && (
        <CollectDueModal
          customer={selectedCustomer}
          sale={selectedSale}
          open={collectModalOpen}
          onOpenChange={setCollectModalOpen}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Due Profile</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="py-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
          ) : detailQuery.data?.success ? (
            <CustomerDueDetail
              data={detailQuery.data.data}
              onCollect={(sale) => {
                setDetailModalOpen(false);
                handleOpenCollect(detailQuery.data.data.customer, sale);
              }}
            />
          ) : (
            <p className="text-center py-6 text-muted-foreground">Failed to load customer profile.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
