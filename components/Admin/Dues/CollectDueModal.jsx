"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Coins, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// =========================================================
// Form Schema
// =========================================================

const collectDueSchema = z.object({
  saleId: z.string().min(1, "Select an invoice"),
  collectionAmount: z.number()
    .min(1, "Amount must be greater than 0")
    .max(999999999, "Amount too high"),
  paymentMethod: z.string().min(1, "Select payment method"),
  collectionDate: z.date({
    required_error: "Collection date is required",
  }),
  note: z.string().optional(),
});

// =========================================================
// Payment Methods
// =========================================================

const paymentMethods = [
  { value: "Cash", label: "Cash" },
  { value: "bKash", label: "bKash" },
  { value: "Nagad", label: "Nagad" },
  { value: "Rocket", label: "Rocket" },
  { value: "Bank", label: "Bank Transfer" },
  { value: "Card", label: "Credit/Debit Card" },
  { value: "Other", label: "Other" },
];

// =========================================================
// CollectDueModal Component
// =========================================================

export default function CollectDueModal({
  customer,
  sale,         // optional pre-selected sale (from CustomerDueDetail)
  open,
  onOpenChange,
  onSuccess
}) {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(sale || null);
  const [remainingDue, setRemainingDue] = useState(sale?.remainingDue || 0);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const form = useForm({
    resolver: zodResolver(collectDueSchema),
    defaultValues: {
      saleId: sale?.saleId || "",
      collectionAmount: sale?.remainingDue || 0,
      paymentMethod: "Cash",
      collectionDate: new Date(),
      note: "",
    },
  });

  const { register, watch, setValue, handleSubmit, reset, formState: { errors, isSubmitting } } = form;

  // Watch form values
  const collectionAmount = watch("collectionAmount");
  const saleId = watch("saleId");

  // When a pre-selected sale is passed, seed state immediately
  useEffect(() => {
    if (sale) {
      setSelectedSale(sale);
      setRemainingDue(sale.remainingDue || 0);
      setValue("saleId", sale.saleId);
      setValue("collectionAmount", sale.remainingDue || 0);
    }
  }, [sale, setValue]);

  // When saleId changes, update remainingDue from the loaded sales list
  useEffect(() => {
    if (!saleId || sales.length === 0) return;
    const current = sales.find(s => s.saleId === saleId);
    if (current) {
      setSelectedSale(current);
      setRemainingDue(current.remainingDue || 0);
      setValue("collectionAmount", current.remainingDue || 0);
    }
  }, [saleId, sales, setValue]);

  // Load sales when customer changes or modal opens
  useEffect(() => {
    if (open && customer?.customerPhone) {
      fetchSales(customer.customerPhone);
    }
  }, [open, customer]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset({
        saleId: sale?.saleId || "",
        collectionAmount: sale?.remainingDue || 0,
        paymentMethod: "Cash",
        collectionDate: new Date(),
        note: "",
      });
      if (!sale) {
        setSelectedSale(null);
        setRemainingDue(0);
      }
    }
  }, [open, sale, reset]);

  const fetchSales = async (phone) => {
    setIsLoadingSales(true);
    try {
      const response = await fetch(`/api/admin/dues/customers/${encodeURIComponent(phone)}`);
      const data = await response.json();
      if (data.success) {
        // Only show sales with outstanding due
        const salesWithDue = (data.data.sales || []).filter(s => s.remainingDue > 0);
        setSales(salesWithDue);

        // If a sale was pre-selected, use it; otherwise default to first
        if (sale) {
          // Refresh remaining due from fresh API data
          const fresh = salesWithDue.find(s => s.saleId === sale.saleId);
          if (fresh) {
            setSelectedSale(fresh);
            setRemainingDue(fresh.remainingDue);
            setValue("saleId", fresh.saleId);
            setValue("collectionAmount", fresh.remainingDue);
          }
        } else if (salesWithDue.length > 0 && !saleId) {
          const first = salesWithDue[0];
          setSelectedSale(first);
          setRemainingDue(first.remainingDue);
          setValue("saleId", first.saleId);
          setValue("collectionAmount", first.remainingDue);
        }
      }
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const onSubmit = async (data) => {
    if (!data.saleId) {
      alert("Please select an invoice");
      return;
    }

    try {
      const response = await fetch("/api/admin/dues/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: data.saleId,
          collectionAmount: data.collectionAmount,
          paymentMethod: data.paymentMethod,
          collectionDate: format(data.collectionDate, "yyyy-MM-dd"),
          note: data.note || "",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        reset();
        onOpenChange(false);
        if (onSuccess) onSuccess(result);
      } else {
        alert(result.message || "Failed to record collection");
      }
    } catch (error) {
      console.error("Collection error:", error);
      alert("An error occurred while recording the collection");
    }
  };

  const afterCollection = Math.max(remainingDue - (collectionAmount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            Collect Due Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer Info */}
          {customer && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">Customer</p>
              <p className="font-medium">{customer.customerName}</p>
              <p className="text-sm text-slate-500">{customer.customerPhone}</p>
            </div>
          )}

          {/* Invoice Selector */}
          <div className="space-y-2">
            <Label htmlFor="saleId">Invoice <span className="text-red-500">*</span></Label>
            <Select
              disabled={isLoadingSales}
              onValueChange={(value) => {
                setValue("saleId", value);
                const selected = sales.find(s => s.saleId === value);
                if (selected) {
                  setSelectedSale(selected);
                  setRemainingDue(selected.remainingDue || 0);
                  setValue("collectionAmount", selected.remainingDue || 0);
                }
              }}
              value={saleId}
            >
              <SelectTrigger id="saleId">
                <SelectValue placeholder={isLoadingSales ? "Loading invoices…" : "Select invoice"} />
              </SelectTrigger>
              <SelectContent>
                {sales.map((s) => (
                  <SelectItem key={s.saleId} value={s.saleId}>
                    {s.invoiceNumber} — Due: {s.remainingDue.toLocaleString("en-BD")} BDT
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.saleId && (
              <p className="text-xs text-red-500">{errors.saleId.message}</p>
            )}
          </div>

          {/* Invoice Details */}
          {selectedSale && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-500">Invoice Date</p>
                <p className="text-sm font-medium">
                  {selectedSale.date ? new Date(selectedSale.date).toLocaleDateString("en-GB") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Amount</p>
                <p className="text-sm font-medium">
                  {(selectedSale.totalPrice || 0).toLocaleString("en-BD")} BDT
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Original Due</p>
                <p className="text-sm font-medium text-orange-600">
                  {(selectedSale.originalDue || 0).toLocaleString("en-BD")} BDT
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Already Collected</p>
                <p className="text-sm font-medium text-emerald-600">
                  {(selectedSale.collectedSoFar || 0).toLocaleString("en-BD")} BDT
                </p>
              </div>
            </div>
          )}

          {/* Remaining Due Display */}
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Remaining Due</span>
              <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                {remainingDue.toLocaleString("en-BD")} BDT
              </span>
            </div>
          </div>

          {/* Collection Amount */}
          <div className="space-y-2">
            <Label htmlFor="collectionAmount">
              Collection Amount (BDT) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="collectionAmount"
                type="number"
                min="1"
                max={remainingDue}
                {...register("collectionAmount", {
                  valueAsNumber: true,
                })}
                className="pl-10"
              />
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            {errors.collectionAmount && (
              <p className="text-xs text-red-500">{errors.collectionAmount.message}</p>
            )}
            {remainingDue > 0 && collectionAmount > 0 && collectionAmount <= remainingDue && (
              <p className="text-xs text-emerald-600">
                After collection: {afterCollection.toLocaleString("en-BD")} BDT remaining
              </p>
            )}
            {collectionAmount > remainingDue && remainingDue > 0 && (
              <p className="text-xs text-red-500">
                Amount cannot exceed remaining due ({remainingDue.toLocaleString("en-BD")} BDT)
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method <span className="text-red-500">*</span></Label>
            <Select
              onValueChange={(value) => setValue("paymentMethod", value)}
              value={watch("paymentMethod")}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-xs text-red-500">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Collection Date */}
          <div className="space-y-2">
            <Label htmlFor="collectionDate">Collection Date <span className="text-red-500">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="collectionDate"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(watch("collectionDate"), "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watch("collectionDate")}
                  onSelect={(date) => setValue("collectionDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.collectionDate && (
              <p className="text-xs text-red-500">{errors.collectionDate.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              rows={3}
              {...register("note")}
              placeholder="Enter any notes about this collection..."
            />
          </div>

          {/* Submit Button */}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || remainingDue === 0 || isLoadingSales}
            >
              {isSubmitting ? "Recording..." : "Record Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
