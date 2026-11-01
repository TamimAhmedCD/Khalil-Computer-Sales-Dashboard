"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  Filter,
  Layers,
  Plus,
  Printer,
  Search,
  Users,
  Wallet,
  Building2,
  RefreshCw,
  Eye,
  CreditCard,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCommissionDashboard } from "@/lib/hooks/reports/use-commission-dashboard";
import { formatCurrency, formatNumber, DATE_LABELS } from "@/lib/utils/finance";

const DATE_OPTIONS = [
  { id: "today", name: DATE_LABELS.today },
  { id: "yesterday", name: DATE_LABELS.yesterday },
  { id: "last-10-days", name: DATE_LABELS["last-10-days"] },
  { id: "week", name: DATE_LABELS.week },
  { id: "month", name: DATE_LABELS.month },
  { id: "last-month", name: DATE_LABELS["last-month"] },
  { id: "year", name: "This Year" },
  { id: "all", name: "All Time" },
  { id: "custom", name: DATE_LABELS.custom },
];

export default function CommissionManagementPage() {
  const [dateFilter, setDateFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Pay form state
  const [payMode, setPayMode] = useState("full"); // 'full' | 'broken' | 'by-date'
  const [payAmount, setPayAmount] = useState("");
  const [payStartDate, setPayStartDate] = useState("");
  const [payEndDate, setPayEndDate] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, isError, error, refetch } = useCommissionDashboard({
    dateFilter,
    recipient: searchTerm,
    customStartDate: dateFilter === "custom" ? customStart : undefined,
    customEndDate: dateFilter === "custom" ? customEnd : undefined,
  });

  const summary = data?.summary || {};
  const recipients = data?.recipients || [];

  const handleOpenPay = (recipient) => {
    setSelectedRecipient(recipient);
    setPayMode("full");
    setPayAmount(String(recipient.remaining || 0));
    setPayStartDate("");
    setPayEndDate("");
    setPayMethod("Cash");
    setPayRef("");
    setPayNote("");
    setPayModalOpen(true);
  };

  const calculatePayAmount = (startStr, endStr) => {
    if (!startStr || !endStr || !selectedRecipient) return;
    const s = new Date(`${startStr}T00:00:00+06:00`);
    const e = new Date(`${endStr}T23:59:59.999+06:00`);
    // Prefer already-loaded detail sales; otherwise fetch from recipient endpoint
    if (detailData && detailData.sales) {
      const sum = detailData.sales
        .filter((sale) => {
          const d = sale.date ? new Date(sale.date) : null;
          return d && d >= s && d <= e;
        })
        .reduce((acc, sale) => acc + Number(sale.commission || 0), 0);
      setPayAmount(String(sum));
      return;
    }
    // Fetch recipient sales for accurate range calculation
    fetch(`/api/reports/commission/recipient/${selectedRecipient._id}?dateFilter=custom&customStartDate=${encodeURIComponent(startStr)}&customEndDate=${encodeURIComponent(endStr)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && res.data.sales) {
          const sum = res.data.sales
            .filter((sale) => {
              const d = sale.date ? new Date(sale.date) : null;
              return d && d >= s && d <= e;
            })
            .reduce((acc, sale) => acc + Number(sale.commission || 0), 0);
          setPayAmount(String(sum));
        } else if (res.success && res.data && res.data.recipient) {
          const earned = res.data.recipient.filteredCommissionEarned;
          setPayAmount(String(earned > 0 ? earned : selectedRecipient?.remaining || 0));
        } else {
          setPayAmount(String(selectedRecipient?.remaining || 0));
        }
      })
      .catch(() => setPayAmount(String(selectedRecipient.remaining || 0)));
  };

  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    if (!selectedRecipient) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (amt > selectedRecipient.remaining) {
      toast.error(`Payment cannot exceed ${formatCurrency(selectedRecipient.remaining)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports/commission/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedRecipient._id,
          amount: amt,
          paymentMethod: payMethod,
          transactionReference: payRef,
          note: payNote,
          dateRange: payMode === "by-date" ? { start: payStartDate, end: payEndDate } : undefined,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Failed to process payout");

      toast.success(`Payout recorded! Receipt: ${result.data.receiptNumber}`);
      setPayModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to process payout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = async (recipient) => {
    setSelectedRecipient(recipient);
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await fetch(`/api/reports/commission/recipient/${recipient._id}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setDetailData(result.data);
    } catch (err) {
      toast.error(err.message || "Failed to load recipient profile");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b">
        <div>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Reports
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Commission Management System</h1>
          <p className="text-sm text-muted-foreground">Manage employee commission earned, payouts, balances, and ledger.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Period &amp; Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CustomSelect
              value={dateFilter}
              onChange={(v) => {
                setDateFilter(v);
                if (v !== "custom") {
                  setCustomStart("");
                  setCustomEnd("");
                }
              }}
              items={DATE_OPTIONS.map((d) => ({ value: d.id, label: d.name }))}
              searchable={false}
              placeholder="Select period"
            />
            {dateFilter === "custom" && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">End</label>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
                <Button size="sm" onClick={() => refetch()} disabled={!customStart || !customEnd}>Apply</Button>
              </div>
            )}
            {(dateFilter === "today" || dateFilter === "yesterday" || dateFilter === "last-10-days" || dateFilter === "week" || dateFilter === "month" || dateFilter === "last-month" || dateFilter === "year" || dateFilter === "custom") && (
              <p className="text-xs text-muted-foreground">
                Summary shows commission earned in the selected <b>period</b>. Remaining due shown on each row.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Search Recipient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search by employee name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <p className="text-xs text-muted-foreground">Showing active employees with commission eligibility.</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="px-6 py-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="px-6 py-8 text-center">
          <CircleDollarSign className="h-10 w-10 text-destructive mx-auto" />
          <p className="mt-2 font-semibold">Failed to load commission data</p>
          <p className="text-sm text-muted-foreground">{error?.message || "Unknown error"}</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && data && (
        <div className="px-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground font-medium">Earned Commission (period)</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(summary.totalCommissionEarned)}</p>
                <p className="text-[10px] text-muted-foreground">Selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground font-medium">Commission Paid</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalCommissionPaid)}</p>
                <p className="text-[10px] text-muted-foreground">Total disbursed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground font-medium">Outstanding Liability</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(summary.totalOutstandingDue)}</p>
                <p className="text-[10px] text-muted-foreground">Unpaid commission due</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground font-medium">Paid Today</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">{formatCurrency(summary.commissionPaidToday)}</p>
                <p className="text-[10px] text-muted-foreground">Disbursed today</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground font-medium">Recipients</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatNumber(summary.totalRecipients)}</p>
                <p className="text-[10px] text-muted-foreground">Eligible employees</p>
              </CardContent>
            </Card>
          </div>

          {/* Pay policy hint */}
          <Card>
            <CardContent className="p-4 flex flex-col items-start gap-2 border-border/70 shadow-sm">
              <span className="text-sm text-primary font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" /> Payout Policy
              </span>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-5">
                <li>Select a period in the filter above the cards — the earning shown is for that period only.</li>
                <li>Click <b>Pay</b> next to an employee whose remaining due &gt; 0.</li>
                <li>Choose <b>Full</b> (pay the entire remaining due) or <b>Broken/Partial</b> (a custom amount).</li>
                <li>Choose payment method: Cash, bKash, Nagad, Bank Transfer, Card, Other.</li>
                <li>A unique receipt number is generated automatically for every payout.</li>
              </ol>
            </CardContent>
          </Card>

          {/* Recipients Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Commission Recipients &amp; Balances
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Earned Commission</TableHead>
                  <TableHead className="text-right">Paid Commission</TableHead>
                  <TableHead className="text-right">Remaining Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((emp) => (
                  <TableRow key={emp._id}>
                    <TableCell className="font-medium">
                      <div>{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.email}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(emp.totalOrders)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(emp.totalSales)}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">{formatCurrency(emp.totalCommissionEarned)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(emp.totalCommissionPaid)}</TableCell>
                    <TableCell className="text-right text-orange-600 font-bold">{formatCurrency(emp.remaining)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDetail(emp)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Profile
                        </Button>
                        <Button
                          size="sm"
                          disabled={emp.remaining <= 0}
                          onClick={() => handleOpenPay(emp)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {recipients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No commission recipients found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Pay Commission Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Commission to {selectedRecipient?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPayout} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Remaining Commission Due (all time)</label>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(selectedRecipient?.remaining || 0)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Amount (৳)</label>
              <div className="flex gap-2 mb-2">
                <Button type="button" size="sm" variant={payMode === "full" ? "default" : "outline"} onClick={() => { setPayMode("full"); setPayAmount(String(selectedRecipient?.remaining || 0)); }}>Full</Button>
                <Button type="button" size="sm" variant={payMode === "broken" ? "default" : "outline"} onClick={() => { setPayMode("broken"); setPayAmount(""); }}>Broken / Partial</Button>
                <Button type="button" size="sm" variant={payMode === "by-date" ? "default" : "outline"} onClick={() => { setPayMode("by-date"); setPayAmount(""); }}>Pay by Date</Button>
              </div>
              {payMode === "full" && (
                <Input type="number" max={selectedRecipient?.remaining || 0} min={1} step="any" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
              )}
              {payMode === "broken" && (
                <>
                  <Input type="number" max={selectedRecipient?.remaining || 0} min={1} step="any" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="e.g. ৳500" required />
                  <div className="flex gap-1 mt-1">
                    {[1, 0.5, 0.25, 0.1].map((q) => {
                      const f = Number(payAmount || 0);
                      return (
                        <Button key={q} type="button" size="sm" variant="outline" disabled={f < q} onClick={() => setPayAmount(String(Math.max(q, 1)))}>
                          {formatCurrency(Math.round(f / q * 100) / 100)}
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}
              {payMode === "by-date" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1"><label className="text-[10px] text-muted-foreground">From</label><Input type="date" value={payStartDate || ""} onChange={(e) => { setPayStartDate(e.target.value); if (payEndDate) calculatePayAmount(e.target.value, payEndDate); }} /></div>
                    <div className="flex-1"><label className="text-[10px] text-muted-foreground">To</label><Input type="date" value={payEndDate || ""} onChange={(e) => { setPayEndDate(e.target.value); if (payStartDate) calculatePayAmount(payStartDate, e.target.value); }} /></div>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setPayAmount(String(selectedRecipient?.filteredCommissionEarned || 0)); }}>
                    Set to selected period earned
                  </Button>
                  <Input type="number" readOnly max={selectedRecipient?.remaining || 0} min={1} step="any" value={payAmount} placeholder="Select date range..." />
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Max allowed: {formatCurrency(selectedRecipient?.remaining || 0)}.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Method</label>
              <CustomSelect
                value={payMethod}
                onChange={(v) => setPayMethod(v)}
                items={[
                  { value: "Cash", label: "Cash" },
                  { value: "bKash", label: "bKash" },
                  { value: "Nagad", label: "Nagad" },
                  { value: "Bank", label: "Bank Transfer" },
                  { value: "Card", label: "Card" },
                  { value: "Other", label: "Other" },
                ]}
                searchable={false}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Transaction Reference (Optional)</label>
              <Input placeholder="e.g. TRX123456" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Note (Optional)</label>
              <Input placeholder="Additional details..." value={payNote} onChange={(e) => setPayNote(e.target.value)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? "Processing..." : "Confirm Payout"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recipient Detail Profile Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recipient Profile: {selectedRecipient?.name}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
          ) : detailData ? (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">All-Time Sales</p>
                  <p className="text-lg font-bold">{formatCurrency(detailData.recipient.totalSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">All-Time Earned</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(detailData.recipient.totalCommissionEarned)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">All-Time Paid</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(detailData.recipient.totalCommissionPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining Due (all time)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(detailData.recipient.remaining)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">This Period Sales</p>
                  <p className="text-lg font-bold">{formatCurrency(detailData.recipient.filteredSalesTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Period Earned</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(detailData.recipient.filteredCommissionEarned)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payouts This Month</p>
                  <Badge variant="outline">See history</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining Due (this period)</p>
                  <p className="text-lg font-bold text-orange-600">—</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Commission Payout History ({detailData.payouts.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.payouts.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                        <TableCell>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell><Badge variant="outline">{p.paymentMethod}</Badge></TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {detailData.payouts.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No payouts recorded yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Sales &amp; Commissions Earned (by period)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Sale Total</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.sales.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell className="text-xs">{new Date(s.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{s.invoiceNumber}</TableCell>
                        <TableCell>{s.customer}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.total)}</TableCell>
                        <TableCell className="text-right font-medium text-blue-600">{formatCurrency(s.commission)} ({s.commissionRate}%)</TableCell>
                      </TableRow>
                    ))}
                    {detailData.sales.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No sales recorded for this period.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">Failed to load profile details.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
