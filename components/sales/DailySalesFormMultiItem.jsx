"use client";

import { useState, useEffect, useMemo } from "react";
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
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import SearchableDropdown from "@/components/ui/SearchableDropdown";

// Schema for multi-item sales
const formSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      saleType: z.enum(["service", "product"]).default("service"),
      productId: z.string().optional(),
      categoryId: z.string().optional(),
      productName: z.string().min(1, "Item name is required"),
      quantity: z
        .number({ invalid_type_error: "Quantity is required" })
        .min(1, "Minimum quantity is 1"),
      price: z
        .number({ invalid_type_error: "Price is required" })
        .min(0, "Price cannot be negative"),
      rawExpense: z.number().min(0).default(0),
      unit: z.string().default("pcs"),
    })
  ).min(1, "At least one item is required"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  paidAmount: z
    .number({ invalid_type_error: "Paid amount is required" })
    .min(0, "Amount cannot be negative"),
  note: z.string().optional(),
});

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank", "Due"];

const DEFAULTS = {
  customerName: "",
  customerPhone: "",
  items: [
    {
      saleType: "service",
      productId: "",
      categoryId: "",
      productName: "",
      quantity: 1,
      price: 0,
      rawExpense: 0,
      unit: "pcs",
    },
  ],
  paymentMethod: "",
  paidAmount: 0,
  note: "",
};

const numberFmt = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
const taka = (n) => `৳${numberFmt.format(Math.round(Number(n) || 0))}`;

const CAPTION =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400";

const PERFORATION = {
  WebkitMaskImage:
    "radial-gradient(circle 6px at 50% 0, transparent 98%, #000 100%)",
  maskImage: "radial-gradient(circle 6px at 50% 0, transparent 98%, #000 100%)",
  WebkitMaskSize: "16px 12px",
  maskSize: "16px 12px",
  WebkitMaskRepeat: "repeat-x",
  maskRepeat: "repeat-x",
};

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

export default function DailySalesFormMultiItem({ redirectTo = "/employee/sales" } = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const router = useRouter();

  // Fetch Categories (services)
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products/categories");
      return data?.data || [];
    },
  });

  // Fetch Products (inventory)
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive !== false),
    [products],
  );

  // React Hook Form Setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: DEFAULTS,
  });

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedFields = watch();
  const watchedItems = watch("items") || [];

  // Memoized calculations
  const calculations = useMemo(() => {
    const total = watchedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const paid = Number(watchedFields.paidAmount) || 0;
    const due = Math.max(total - paid, 0);

    const totalRawExpense = watchedItems.reduce((sum, item) => sum + (Number(item.rawExpense) || 0), 0);

    // Calculate commission per item based on product/category
    let totalCommission = 0;
    watchedItems.forEach((item, index) => {
      const itemPrice = Number(item.price) || 0;
      if (item.saleType === "product" && item.productId) {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          const commPct = Number(product.commission || 0);
          totalCommission += Math.round((itemPrice * commPct) / 100);
        }
      } else if (item.saleType === "service" && item.categoryId) {
        const category = categories.find(c => c._id === item.categoryId);
        if (category) {
          const commPct = Number(category.commission || 0);
          totalCommission += Math.round((itemPrice * commPct) / 100);
        }
      }
    });

    const totalExpense = totalRawExpense + totalCommission;
    const netProfit = Math.round(total - totalExpense);

    return {
      total,
      totalRawExpense,
      totalCommission,
      totalExpense,
      netProfit,
      due,
    };
  }, [watchedItems, watchedFields.paidAmount, products, categories]);

  // Auto-Payment Logic for 'Due'
  useEffect(() => {
    const total = calculations.total;
    const paid = Number(watchedFields.paidAmount) || 0;
    const currentDue = Math.max(total - paid, 0);

    if (currentDue > 0 && paid === 0) {
      setValue("paymentMethod", "Due", { shouldValidate: true });
    } else if (watchedFields.paymentMethod === "Due" && paid > 0) {
      setValue("paymentMethod", "Cash", { shouldValidate: true });
    }
  }, [calculations.total, watchedFields.paidAmount, watchedFields.paymentMethod, setValue]);

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
      const payload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        items: data.items.map(item => ({
          saleType: item.saleType,
          productId: item.productId || undefined,
          categoryId: item.categoryId || undefined,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          rawExpense: item.rawExpense,
          unit: item.unit,
        })),
        paymentMethod: data.paymentMethod,
        paidAmount: data.paidAmount,
        note: data.note,
      };

      const response = await axios.post("/api/products/sales", payload);
      toast.success(response.data.message || "Sale recorded.");
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

  const handleAddItem = () => {
    append({
      saleType: "service",
      productId: "",
      categoryId: "",
      productName: "",
      quantity: 1,
      price: 0,
      rawExpense: 0,
      unit: "pcs",
    });
  };

  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setValue(`items.${index}.productId`, productId);
      setValue(`items.${index}.productName`, product.name);
      setValue(`items.${index}.unit`, product.unit || "pcs");
      // Pre-fill with default price but user can edit
      const qty = Number(watchedItems[index]?.quantity) || 1;
      setValue(`items.${index}.price`, Number(product.saleRate || 0) * qty);
      setValue(`items.${index}.rawExpense`, Number(product.buyRate || 0) * qty);
    }
  };

  const handleCategorySelect = (index, categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    if (category) {
      setValue(`items.${index}.categoryId`, categoryId);
      setValue(`items.${index}.productName`, category.name);
    }
  };

  return (
    <div className="min-h-screen text-zinc-800 dark:text-zinc-100 py-8 transition-colors duration-200">
      <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-200/40 dark:bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-300/30 dark:bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <form
          onSubmit={handlePreSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start"
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
                Add multiple products or services to a single sale. Enter prices manually.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => reset(DEFAULTS)}
                className="h-9 px-4 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium rounded-lg"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={
                  !isValid || Object.keys(errors).length > 0 || isSubmitting
                }
                className="h-9 px-6 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium rounded-lg shadow-xs"
              >
                {!isValid || Object.keys(errors).length > 0
                  ? "Fill required fields"
                  : "Review sale"}
              </Button>
            </div>
          </header>

          {/* Main Inputs Form */}
          <main className="col-span-12 lg:col-span-8 space-y-6">
            {/* Customer Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-sm font-bold tracking-wider text-zinc-600 dark:text-zinc-300 uppercase">
                  Customer Information
                </h2>
              </div>
              <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs">
                <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={CAPTION}>Customer Name (Optional)</label>
                    <Input
                      className="h-10"
                      {...register("customerName")}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={CAPTION}>Phone (Optional)</label>
                    <Input
                      className="h-10"
                      {...register("customerPhone")}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Items Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold tracking-wider text-zinc-600 dark:text-zinc-300 uppercase">
                  Items
                </h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const item = watchedItems[index] || {};
                  const isProduct = item.saleType === "product";

                  return (
                    <Card
                      key={field.id}
                      className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs"
                    >
                      <CardContent className="p-4 space-y-4">
                        {/* Item header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500">
                              Item {index + 1}
                            </span>
                            {/* Type toggle */}
                            <div className="inline-flex gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 p-0.5">
                              {[
                                { key: "service", label: "Service", Icon: Wrench },
                                { key: "product", label: "Product", Icon: Package },
                              ].map(({ key, label, Icon }) => {
                                const active = item.saleType === key;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      setValue(`items.${index}.saleType`, key);
                                      setValue(`items.${index}.productId`, "");
                                      setValue(`items.${index}.categoryId`, "");
                                      setValue(`items.${index}.productName`, "");
                                    }}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 h-6 rounded-full text-[10px] font-medium transition-all",
                                      active
                                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                                    )}
                                  >
                                    <Icon size={12} /> {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Product/Category selector */}
                          <div className="space-y-1.5">
                            <label className={CAPTION}>
                              {isProduct ? "Product *" : "Category *"}
                            </label>
                            {isProduct ? (
                              <SearchableDropdown
                                value={item.productId || ""}
                                onChange={(v) => handleProductSelect(index, v)}
                                items={activeProducts}
                                loading={loadingProducts}
                                error={!!errors.items?.[index]?.productId}
                                displayValue={(product) => (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {taka(product.saleRate)} · {Number(product.stock || 0)} in stock
                                    </span>
                                  </div>
                                )}
                                displayLabel={(product) => product.name}
                              />
                            ) : (
                              <SearchableDropdown
                                value={item.categoryId || ""}
                                onChange={(v) => handleCategorySelect(index, v)}
                                items={categories}
                                loading={loadingCategories}
                                error={!!errors.items?.[index]?.categoryId}
                              />
                            )}
                          </div>

                          {/* Product Name */}
                          <div className="space-y-1.5">
                            <label className={CAPTION}>Item Name *</label>
                            <Input
                              className="h-10"
                              readOnly={isProduct}
                              {...register(`items.${index}.productName`)}
                              placeholder="Item name"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="space-y-1.5">
                            <label className={CAPTION}>Quantity *</label>
                            <Input
                              className="h-10"
                              type="number"
                              min="1"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            />
                          </div>

                          {/* Unit */}
                          <div className="space-y-1.5">
                            <label className={CAPTION}>Unit</label>
                            <Input
                              className="h-10"
                              {...register(`items.${index}.unit`)}
                              placeholder="pcs"
                            />
                          </div>

                          {/* Price (Manual Entry!) */}
                          <div className="space-y-1.5">
                            <label className={CAPTION}>Price * (Manual Entry)</label>
                            <Input
                              className="h-10 border-emerald-200 dark:border-emerald-800"
                              type="number"
                              step="any"
                              min="0"
                              {...register(`items.${index}.price`, { valueAsNumber: true })}
                              placeholder="Enter price"
                            />
                            {errors.items?.[index]?.price && (
                              <p className="text-xs text-red-500">
                                {errors.items[index].price.message}
                              </p>
                            )}
                          </div>

                          {/* Raw Expense */}
                          {!isProduct && (
                            <div className="space-y-1.5">
                              <label className={CAPTION}>Expense</label>
                              <Input
                                className="h-10"
                                type="number"
                                step="any"
                                min="0"
                                {...register(`items.${index}.rawExpense`, { valueAsNumber: true })}
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Payment Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-sm font-bold tracking-wider text-zinc-600 dark:text-zinc-300 uppercase">
                  Payment
                </h2>
              </div>
              <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={CAPTION}>Method *</label>
                      <Select
                        onValueChange={(v) =>
                          setValue("paymentMethod", v, { shouldValidate: true })
                        }
                        value={watchedFields.paymentMethod || ""}
                      >
                        <SelectTrigger className="h-10">
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
                    </div>

                    <div className="space-y-1.5">
                      <label className={cn(CAPTION, "text-emerald-600 dark:text-emerald-400")}>
                        Amount Paid *
                      </label>
                      <Input
                        className="h-10 border-emerald-200 focus:ring-emerald-500/20"
                        type="number"
                        step="any"
                        min="0"
                        {...register("paidAmount", { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={CAPTION}>Transaction Notes</label>
                    <Textarea
                      {...register("note")}
                      placeholder="Optional details..."
                      className="min-h-20"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>

          {/* Cash memo */}
          <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-8">
            <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xl">
              <div
                aria-hidden
                className="h-3 bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800"
                style={PERFORATION}
              />
              <div className="px-6 pb-6">
                <div className="flex items-start justify-between gap-3 border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-4">
                  <div className="min-w-0">
                    <p className={CAPTION}>Cash memo</p>
                    <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {watchedItems.length} item{watchedItems.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Items list */}
                <div className="pt-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {watchedItems.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate mr-2">{item.productName || `Item ${i + 1}`}</span>
                      <span className="font-mono tabular-nums">{taka(item.price || 0)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-2.5">
                  <MemoRow label="Subtotal" value={taka(calculations.total)} />
                  <MemoRow label="Expense" value={`−${taka(calculations.totalRawExpense)}`} />
                  <MemoRow label="Commission" value={`−${taka(calculations.totalCommission)}`} />
                </div>

                <div className="mt-4 border-t-4 border-double border-zinc-300 pt-4 dark:border-zinc-700">
                  <div className="flex items-end justify-between gap-2">
                    <span className={CAPTION}>Net profit</span>
                    <span
                      className={cn(
                        "font-mono text-3xl font-semibold tabular-nums tracking-tight",
                        calculations.netProfit < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {taka(calculations.netProfit)}
                    </span>
                  </div>
                  {calculations.netProfit < 0 && (
                    <p className="mt-1.5 text-right text-[11px] text-red-600 dark:text-red-400">
                      This sale loses money
                    </p>
                  )}
                </div>

                <div className="mt-5 space-y-2.5 border-t border-dashed border-zinc-300 pt-4 dark:border-zinc-700">
                  <MemoRow label="Paid" value={taka(watchedFields.paidAmount)} />
                  <MemoRow
                    label="Balance due"
                    strong
                    tone={calculations.due > 0 ? "due" : "muted"}
                    value={taka(calculations.due)}
                  />
                  {calculations.due <= 0 && Number(watchedFields.paidAmount) > 0 && (
                    <p className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck size={14} /> Settled in full
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    !isValid || Object.keys(errors).length > 0 || isSubmitting
                  }
                  className="mt-6 h-11 w-full rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-700 font-semibold text-white transition-all hover:from-zinc-700 hover:to-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-950 dark:hover:from-zinc-200 dark:hover:to-zinc-300 shadow-md"
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
                Sale of{" "}
                <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                  {taka(calculations.total)}
                </strong>{" "}
                with {watchedItems.length} item{watchedItems.length !== 1 ? "s" : ""}. An invoice number is issued and reports update right away.
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
