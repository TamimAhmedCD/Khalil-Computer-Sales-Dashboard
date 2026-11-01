"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { formatCurrency } from "@/lib/utils/finance";
import { useCollectDue } from "@/lib/hooks/dues/useCollectDue";

export default function CollectDueModal({ customer, sale, open, onOpenChange, onSuccess }) {
  const [selectedSaleId, setSelectedSaleId] = useState(sale?._id || customer?.sales?.[0]?._id || "");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const collectMutation = useCollectDue();

  const activeSale = customer?.sales?.find((s) => s._id === selectedSaleId) || sale;
  const remainingDue = activeSale ? Number(activeSale.remainingDue || activeSale.due || 0) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    if (amt > remainingDue) {
      alert(`Amount cannot exceed remaining due (৳${remainingDue})`);
      return;
    }

    collectMutation.mutate(
      {
        saleId: selectedSaleId || sale?._id,
        collectionAmount: amt,
        paymentMethod,
        collectionDate,
        note,
      },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          if (onSuccess) onSuccess(data);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collect Due from {customer?.customerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Select Invoice</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={selectedSaleId}
              onChange={(e) => {
                setSelectedSaleId(e.target.value);
                setAmount("");
              }}
            >
              {customer?.sales?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.invoiceNumber} — Due: ৳{s.remainingDue ?? s.due}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Outstanding Due for Invoice</label>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(remainingDue)}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Collection Amount (৳)</label>
            <Input
              type="number"
              max={remainingDue}
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              required
            />
            <div className="flex gap-1 mt-1">
              {[remainingDue, Math.round(remainingDue / 2), Math.round(remainingDue / 4)].map((val, idx) => (
                val > 0 && (
                  <Button key={idx} type="button" size="sm" variant="outline" onClick={() => setAmount(String(val))}>
                    {formatCurrency(val)}
                  </Button>
                )
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Method</label>
            <CustomSelect
              value={paymentMethod}
              onChange={(v) => setPaymentMethod(v)}
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
            <label className="text-xs font-medium text-muted-foreground block mb-1">Collection Date</label>
            <Input
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Note (Optional)</label>
            <Input
              placeholder="Collection remarks..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={collectMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {collectMutation.isPending ? "Processing..." : "Record Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
