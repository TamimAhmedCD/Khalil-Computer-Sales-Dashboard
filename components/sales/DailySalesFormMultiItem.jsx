"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  User,
  CreditCard,
  BadgeCheck,
  ShieldCheck,
  Wrench,
  Package,
  Search,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getProducts } from "@/lib/services/products.api";

// 🔄 Multi-item schema with array validation
const itemSchema = z
  .object({
    saleType: z.enum(["service", "product"]).default("service"),
    productName: z.string().min(2, "Product or service name is required"),
    categoryId: z.string().optional(),
    productId: z.string().optional(),
    quantity: z
      .number({ invalid_type_error: "Quantity is required" })
      .min(1, "Minimum quantity is 1"),
    totalPrice: z
      .number({ invalid_type_error: "Total price is required" })
      .min(0, "Price cannot be negative"),
    rawExpense: z
      .number({ invalid_type_error: "Expense is required" })
      .min(0, "Expense cannot be negative"),
  })
  .superRefine((data, ctx) => {
    if (
      data.saleType === "service" &&
      (!data.categoryId || data.categoryId.trim().length < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Please select a category",
      });
    }
    if (
      data.saleType === "product" &&
      (!data.productId || data.productId.trim().length < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Please select a product",
      });
    }
  });

const formSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  paidAmount: z
    .number({ invalid_type_error: "Paid amount is required" })
    .min(0, "Amount cannot be negative"),
  note: z.string().optional(),
});

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank", "Due"];
const mandatoryCategories = [
  "DCR",
  "Khajna Payment",
  "Namjari",
  "Khajna Nibondon",
  "Miss Case",
  "Khatian Application",
];

const DEFAULTS = {
  customerName: "",
  customerPhone: "",
  items: [
    {
      saleType: "service",
      productName: "",
      categoryId: "",
      productId: "",
      quantity: 1,
      totalPrice: 0,
      rawExpense: 0,
    },
  ],
  paymentMethod: "",
  paidAmount: 0,
  note: "",
};

// 💰 Formatting
const numberFmt = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
const taka = (n) => `৳${numberFmt.format(Math.round(Number(n) || 0))}`;

// Micro-caption
const CAPTION =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400";

// 🧾 Perforation
const PERFORATION = {
  WebkitMaskImage:
    "radial-gradient(circle 6px at 50% 0, transparent 98%, #000 100%)",
  maskImage: "radial-gradient(circle 6px at 50% 0, transparent 98%, #000 100%)",
  WebkitMaskSize: "16px 12px",
  maskSize: "16px 12px",
  WebkitMaskRepeat: "repeat-x",
  maskRepeat: "repeat-x",
};

// 🧾 Memo Row
function MemoRow({ label, value, tone = "default", strong = false }) {
  const tones = {
    default: "text-zinc-800 dark:text-zinc-100",
    muted: "text-zinc-400 dark:text-zinc-500",
    due: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("shrink-0", CAPTION)}>{label}</span>
      <span
        aria-hidden
        className="mb-[3px] flex-1 self-end border-b border-dotted border-zinc-300 dark:border-zinc-700"
      />
      <span
        className={cn(
          "shrink-0 font-mono text-sm tabular-nums",
          strong && "font-semibold",
          tones[tone],
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Custom Searchable Dropdown Component ───
function SearchableDropdown({
  value,
  onChange,
  items,
  loading = false,
  displayValue,
  displayLabel,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  const selected = items.find((i) => i._id === value);

  const filtered = search.trim()
    ? items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => {
      setMounted(true);
    }, 0);
  };

  const handleClose = () => {
    setMounted(false);
    setTimeout(() => {
      setOpen(false);
      setSearch("");
    }, 150);
  };

  const handleToggle = () => {
    if (open) handleClose();
    else handleOpen();
  };

  const handleSelect = (item) => {
    onChange(item._id);
    handleClose();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full z-50">
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
          error ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30" : "",
          open && "ring-2 ring-blue-500/30 border-blue-500/50",
          loading && "opacity-60 cursor-not-allowed"
        )}
        disabled={loading}
      >
        {selected ? (
          <span className="truncate">{displayLabel ? displayLabel(selected) : selected.name}</span>
        ) : loading ? (
          <span className="text-muted-foreground">Loading...</span>
        ) : (
          <span className="text-muted-foreground">Select...</span>
        )}
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-[99999] mt-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl",
            "transition-all duration-150 ease-out",
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2"
          )}
        >
          <div className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur px-3 py-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No items found
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  role="option"
                  aria-selected={item._id === value}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-sm text-left transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                    item._id === value && "bg-zinc-50 dark:bg-zinc-800/30 font-medium"
                  )}
                >
                  {displayValue ? displayValue(item) : <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">{item.name}</span>}
                  {item._id === value && (
                    <Check className="ml-auto h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailySalesFormMultiItem({ redirectTo = "/employee/sales" } = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const router = useRouter();

  // Fetch Categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products/categories");
      return data?.data || [];
    },
  });

  // Fetch Products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive !== false),
    [products],
  );

  // React Hook Form Setup with useFieldArray
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: DEFAULTS,
  });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    trigger,
    setError,
    clearErrors,
    control,
    formState: { errors, isValid },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedFields = watch();

  // Memoized calculations across all items
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalExpense = 0;
    let totalCommission = 0;

    watchedFields.items.forEach((item) => {
      const isProduct = item.saleType === "product";
      const itemTotal = Number(item.totalPrice) || 0;
      const qty = Number(item.quantity) || 0;

      subtotal += itemTotal;

      if (isProduct) {
        const selectedProduct = products.find((p) => p._id === item.productId);
        if (selectedProduct) {
          const cost = Number(selectedProduct.buyRate || 0) * qty;
          const commPct = Number(selectedProduct.commission || 0);
          const commission = Math.round((itemTotal * commPct) / 100);
          totalExpense += cost + commission;
          totalCommission += commission;
        }
      } else {
        const expense = Number(item.rawExpense) || 0;
        const selectedCategory = categories.find((c) => c._id === item.categoryId);
        if (selectedCategory) {
          const commPct = Number(selectedCategory.commission || 0);
          const commission = Math.round((itemTotal * commPct) / 100);
          totalExpense += expense + commission;
          totalCommission += commission;
        } else {
          totalExpense += expense;
        }
      }
    });

    const netProfit = Math.round(subtotal - totalExpense);
    const paid = Number(watchedFields.paidAmount) || 0;
    const due = Math.max(subtotal - paid, 0);
    const commissionPct = subtotal > 0 ? ((totalCommission / subtotal) * 100).toFixed(1) : 0;

    return {
      subtotal,
      totalExpense,
      netProfit,
      totalCommission,
      commissionPct,
      due,
    };
  }, [watchedFields.items, watchedFields.paidAmount, products, categories]);

  // Auto-Payment Logic for 'Due'
  useEffect(() => {
    const paid = Number(watchedFields.paidAmount) || 0;
    const currentDue = Math.max(calculations.subtotal - paid, 0);

    if (currentDue > 0 && paid === 0) {
      setValue("paymentMethod", "Due", { shouldValidate: true });
    } else if (watchedFields.paymentMethod === "Due" && paid > 0) {
      setValue("paymentMethod", "Cash", { shouldValidate: true });
    }
  }, [calculations.subtotal, watchedFields.paidAmount, watchedFields.paymentMethod, setValue]);

  // Sync Drafts
  useEffect(() => {
    const saved = localStorage.getItem("sales_draft_multi");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach((key) =>
        setValue(key, parsed[key], { shouldValidate: true }),
      );
    }
  }, [setValue]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem("sales_draft_multi", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    trigger();
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors || !isValid) {
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }
    setShowConfirm(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Debug logging
      console.log("=== SUBMITTING MULTI-ITEM SALE ===");
      console.log("Form data:", data);
      console.log("Items:", data.items);

      const payload = {
        items: data.items.map((item) => ({
          saleType: item.saleType,
          productId: item.productId,
          categoryId: item.categoryId,
          productName: item.productName,
          quantity: Number(item.quantity) || 1,
          totalPrice: Number(item.totalPrice) || 0,
          rawExpense: Number(item.rawExpense) || 0,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
        })),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        paymentMethod: data.paymentMethod,
        paidAmount: Number(data.paidAmount) || 0,
        note: data.note,
      };

      console.log("Payload:", payload);

      const response = await axios.post("/api/products/sales", payload);
      toast.success(response.data.message || "Sale recorded.");
      localStorage.removeItem("sales_draft_multi");
      reset(DEFAULTS);
      setShowConfirm(false);
      router.push(redirectTo);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shortcut key (Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        const hasErrors = Object.keys(errors).length > 0;
        if (isValid && !hasErrors) {
          setShowConfirm(true);
        } else {
          toast.error("Please fix the highlighted fields before submitting.");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isValid, errors]);

  return (
    <div className="min-h-screen text-zinc-800 dark:text-zinc-100 py-8 transition-colors duration-200">
      {/* Professional Ambient Soft Underlays */}
      <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-200/40 dark:bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-300/30 dark:bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <form
          onSubmit={handlePreSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Enterprise Header */}
          <header className="col-span-12 flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800/60 gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  Sales Desk
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                New Sale
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Add multiple items to a single sale transaction.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => reset(DEFAULTS)}
                className="h-8 px-3 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium rounded-md"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={
                  !isValid || Object.keys(errors).length > 0 || isSubmitting
                }
                className="h-8 px-4 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium rounded-md shadow-xs"
              >
                {!isValid || Object.keys(errors).length > 0
                  ? "Fill fields"
                  : "Review sale (Ctrl+Enter)"}
              </Button>
            </div>
          </header>

          {/* Main Inputs Form */}
          <main className="col-span-12 lg:col-span-8 space-y-4">
            {/* Items Section */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  <h2 className="text-sm font-bold tracking-wider text-zinc-600 dark:text-zinc-300 uppercase">
                    Items ({fields.length})
                  </h2>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    append({
                      saleType: "service",
                      productName: "",
                      categoryId: "",
                      productId: "",
                      quantity: 1,
                      totalPrice: 0,
                      rawExpense: 0,
                    })
                  }
                  className="h-7 px-2.5 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>

              {/* Dynamic Item Rows */}
              {fields.map((field, index) => (
                <ItemRow
                  key={field.id}
                  index={index}
                  item={watchedFields.items[index]}
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  categories={categories}
                  products={activeProducts}
                  loadingCategories={loadingCategories}
                  loadingProducts={loadingProducts}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                />
              ))}
            </section>

            {/* Section: Customer & Payment */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-sm font-bold tracking-wider text-zinc-600 dark:text-zinc-300 uppercase">
                  Customer & Payment
                </h2>
              </div>
              <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-lg border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs">
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={CAPTION}>Customer Name (Optional)</label>
                    <Input
                      className="h-9"
                      {...register("customerName")}
                      placeholder="John Doe"
                    />
                    {errors.customerName && (
                      <p className="text-[10px] text-red-500 mt-0.5">
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className={CAPTION}>Phone (Optional)</label>
                    <Input
                      className="h-9"
                      {...register("customerPhone")}
                      placeholder="01xxxxxxxxx"
                    />
                    {errors.customerPhone && (
                      <p className="text-[10px] text-red-500 mt-0.5">
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className={CAPTION}>Payment Method *</label>
                    <Select
                      onValueChange={(v) =>
                        setValue("paymentMethod", v, { shouldValidate: true })
                      }
                      value={watchedFields.paymentMethod || ""}
                    >
                      <SelectTrigger size="3" className="w-full h-9">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.paymentMethod && (
                      <p className="text-[10px] text-red-500 mt-0.5">
                        {errors.paymentMethod.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        CAPTION,
                        "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      Amount Paid *
                    </label>
                    <Input
                      className="h-9 border-emerald-200 focus:ring-emerald-500/20"
                      type="number"
                      step="any"
                      {...register("paidAmount", { valueAsNumber: true })}
                      placeholder="0"
                    />
                    {errors.paidAmount && (
                      <p className="text-[10px] text-red-500 mt-0.5">
                        {errors.paidAmount.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className={CAPTION}>Transaction Notes</label>
                    <Textarea
                      {...register("note")}
                      placeholder="Optional details..."
                      className="min-h-12"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>

          {/* 🧾 Compact Cash Memo - Right Sidebar */}
          <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-4">
            <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-lg border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs overflow-visible">
              {/* Compact Header */}
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Cash memo</p>
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {fields.length} {fields.length === 1 ? "Item" : "Items"}
                    </p>
                  </div>
                  <Badge className="rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    Multi
                  </Badge>
                </div>
              </div>

              {/* Compact Calculations */}
              <div className="px-4 py-3 space-y-2">
                <MemoRow label="Subtotal" value={taka(calculations.subtotal)} />

                {calculations.totalExpense > 0 && (
                  <MemoRow
                    label="Expense"
                    value={`−${taka(calculations.totalExpense)}`}
                  />
                )}

                {calculations.totalCommission > 0 && (
                  <div className="space-y-0.5">
                    <MemoRow
                      label="Commission"
                      value={`−${taka(calculations.totalCommission)}`}
                    />
                    <p className="text-[9px] text-zinc-500 text-right">
                      {calculations.commissionPct}% of subtotal
                    </p>
                  </div>
                )}
              </div>

              {/* Net Profit (Compact) */}
              <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800/50">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Net profit
                  </span>
                  <span
                    className={cn(
                      "font-mono text-lg font-bold tabular-nums",
                      calculations.netProfit < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {taka(calculations.netProfit)}
                  </span>
                </div>
              </div>

              {/* Settlement (Compact) */}
              <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-b-lg">
                <MemoRow
                  label="Paid"
                  value={taka(watchedFields.paidAmount)}
                />
                <MemoRow
                  label="Due"
                  strong
                  tone={calculations.due > 0 ? "due" : "muted"}
                  value={taka(calculations.due)}
                />
              </div>

              {/* Submit Button */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50">
                <Button
                  type="submit"
                  disabled={
                    !isValid || Object.keys(errors).length > 0 || isSubmitting
                  }
                  className="h-9 w-full text-sm rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-700 font-semibold text-white hover:from-zinc-700 hover:to-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-950 dark:hover:from-zinc-200 dark:hover:to-zinc-300"
                >
                  {!isValid || Object.keys(errors).length > 0
                    ? "Fill required fields"
                    : "Complete sale"}
                </Button>
              </div>
            </Card>
          </aside>
        </form>

        {/* Confirmation Modal */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="w-[90%] max-w-md rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Record this sale?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sale with <strong>{fields.length} items</strong> totaling{" "}
                <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                  {taka(calculations.subtotal)}
                </strong>. An invoice number is issued and reports update right away.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row gap-2 mt-4">
              <AlertDialogCancel className="w-1/2 mt-0 rounded-lg h-10 text-sm border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                Review
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isSubmitting}
                onClick={handleSubmit(onSubmit)}
                className="w-1/2 rounded-lg h-10 text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-md"
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── ItemRow Component ───
function ItemRow({
  index,
  item,
  register,
  setValue,
  errors,
  categories,
  products,
  loadingCategories,
  loadingProducts,
  onRemove,
  canRemove,
}) {
  const isProduct = item.saleType === "product";

  const handleModeChange = (mode) => {
    if (mode === item.saleType) return;
    setValue(`items.${index}.saleType`, mode);
    setValue(`items.${index}.categoryId`, "");
    setValue(`items.${index}.productId`, "");
    setValue(`items.${index}.productName`, "");
    setValue(`items.${index}.totalPrice`, 0);
    setValue(`items.${index}.rawExpense`, 0);
    setValue(`items.${index}.quantity`, 1);
  };

  const handleCategorySelect = (v) => {
    setValue(`items.${index}.categoryId`, v, { shouldValidate: true });
    const selectedCategory = categories.find((cat) => cat._id === v);
    if (selectedCategory) {
      setValue(`items.${index}.productName`, selectedCategory.name, {
        shouldValidate: true,
      });
    }
  };

  const handleProductSelect = (v) => {
    setValue(`items.${index}.productId`, v, { shouldValidate: true });
    const p = products.find((x) => x._id === v);
    if (p) {
      const qty = Number(item.quantity) || 1;
      setValue(`items.${index}.productName`, p.name, { shouldValidate: true });
      setValue(`items.${index}.totalPrice`, Number(p.saleRate || 0) * qty, {
        shouldValidate: true,
      });
      setValue(`items.${index}.rawExpense`, Number(p.buyRate || 0) * qty, {
        shouldValidate: true,
      });
    }
  };

  // Real-time quantity update for products
  useEffect(() => {
    if (isProduct && item.productId) {
      const p = products.find((x) => x._id === item.productId);
      if (p) {
        const qty = Number(item.quantity) || 0;
        setValue(`items.${index}.totalPrice`, Number(p.saleRate || 0) * qty, {
          shouldValidate: true,
        });
        setValue(`items.${index}.rawExpense`, Number(p.buyRate || 0) * qty, {
          shouldValidate: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProduct, item.quantity, item.productId]);

  const selectedProduct = products.find((p) => p._id === item.productId);

  const CAPTION =
    "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400";

  return (
    <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-lg border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs overflow-visible relative z-40">
      <CardContent className="p-3 space-y-2">
        {/* Compact Header Row */}
        <div className="flex items-center gap-2">
          {/* Type Toggle - Compact Icons Only */}
          <div
            role="group"
            aria-label="Sale type"
            className="inline-flex gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 p-0.5"
          >
            {[
              { key: "service", Icon: Wrench },
              { key: "product", Icon: Package },
            ].map(({ key, Icon }) => {
              const active = item.saleType === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleModeChange(key)}
                  className={cn(
                    "inline-flex items-center justify-center p-1.5 rounded transition-all",
                    active
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  )}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          {/* Item Selector - Compact */}
          <div className="flex-1 min-w-0">
            {isProduct ? (
              <SearchableDropdown
                value={item.productId}
                onChange={handleProductSelect}
                items={products}
                loading={loadingProducts}
                error={!!errors?.items?.[index]?.productId}
                displayValue={(product) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-xs">{product.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ৳{product.saleRate} · {Number(product.commission || 0)}% · Stock: {Number(product.stock || 0)}
                    </span>
                  </div>
                )}
                displayLabel={(product) => product.name}
              />
            ) : (
              <SearchableDropdown
                value={item.categoryId}
                onChange={handleCategorySelect}
                items={categories}
                loading={loadingCategories}
                error={!!errors?.items?.[index]?.categoryId}
              />
            )}
          </div>

          {/* Remove Button */}
          {canRemove && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onRemove}
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Compact Input Row */}
        <div className="grid grid-cols-12 gap-2">
          {/* Price */}
          <div className="col-span-5 space-y-1">
            <label className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Price *</label>
            <Input
              className="h-8 text-sm"
              type="number"
              step="any"
              {...register(`items.${index}.totalPrice`, {
                valueAsNumber: true,
              })}
              placeholder="0"
            />
            {errors?.items?.[index]?.totalPrice && (
              <p className="text-[10px] text-red-500">{errors.items[index].totalPrice.message}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="col-span-3 space-y-1">
            <label className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Qty *</label>
            <Input
              className="h-8 text-sm"
              type="number"
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
              placeholder="1"
            />
            {errors?.items?.[index]?.quantity && (
              <p className="text-[10px] text-red-500">{errors.items[index].quantity.message}</p>
            )}
          </div>

          {/* Expense (for services) or Stock Info (for products) */}
          {!isProduct ? (
            <div className="col-span-4 space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Expense *</label>
              <Input
                className="h-8 text-sm"
                type="number"
                step="any"
                {...register(`items.${index}.rawExpense`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
              {errors?.items?.[index]?.rawExpense && (
                <p className="text-[10px] text-red-500">{errors.items[index].rawExpense.message}</p>
              )}
            </div>
          ) : selectedProduct ? (
            <div className="col-span-4 flex items-end pb-1">
              <p className="text-[10px] text-zinc-500">
                Stock: {Number(selectedProduct.stock || 0)} · {Number(selectedProduct.commission || 0)}%
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
