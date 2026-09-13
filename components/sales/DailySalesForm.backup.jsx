"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
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

// 🔄 স্কিমা: এখন সেল দুই ধরনের হতে পারে — "service" (ক্যাটাগরি ভিত্তিক) অথবা "product" (ইনভেন্টরি ভিত্তিক)।
// categoryId শুধু service-এ, productId শুধু product-এ রিকোয়ার্ড — superRefine দিয়ে কন্ডিশনাল ভ্যালিডেশন।
const formSchema = z
  .object({
    saleType: z.enum(["service", "product"]).default("service"),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
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
    paymentMethod: z.string().min(1, "Please select a payment method"),
    paidAmount: z
      .number({ invalid_type_error: "Paid amount is required" })
      .min(0, "Amount cannot be negative"),
    note: z.string().optional(),
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
  saleType: "service",
  customerName: "",
  customerPhone: "",
  productName: "",
  categoryId: "",
  productId: "",
  quantity: 1,
  totalPrice: 0,
  rawExpense: 0,
  paymentMethod: "",
  paidAmount: 0,
  note: "",
};

// 💰 মেমোর সব অ্যামাউন্ট tabular numerals-এ দেখানো হয়, তাই ফরম্যাটারকে symbol-free
// রেখে ৳ নিজেরাই বসাচ্ছি — এতে কলামগুলো নিখুঁতভাবে অ্যালাইন থাকে।
const numberFmt = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
const taka = (n) => `৳${numberFmt.format(Math.round(Number(n) || 0))}`;

// Micro-caption used for every field label on the left column
const CAPTION =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400";

// 🧾 মেমোর ওপরের পারফোরেটেড (ছেঁড়া কাগজের) কিনারা — mask দিয়ে স্ক্যালপ কাটা হয়েছে
const PERFORATION = {
  WebkitMaskImage:
    "radial-gradient(circle 6px at 50% 0, transparent 98%, #000 100%)",
  maskImage: "radial-gradient(circle 6px at 50% 0, transparent 98%, #000 100%)",
  WebkitMaskSize: "16px 12px",
  maskSize: "16px 12px",
  WebkitMaskRepeat: "repeat-x",
  maskRepeat: "repeat-x",
};

// 🧾 ক্যাশ-মেমোর এক লাইন: লেবেল ⟶ ডটেড লিডার ⟶ অ্যামাউন্ট (আসল দোকানের মেমোর মতো)
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

// ─── Custom Searchable Dropdown Component ───────────────────────────────────
// Uses fixed positioning to avoid z-index/overflow issues with parent containers

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

  // Filter items by search term
  const filtered = search.trim()
    ? items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Open → trigger animation
  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => {
      setMounted(true);
    }, 0);
  };

  // Close → animate out first, then remove from DOM
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

  // Click outside to close
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

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full z-30">
      {/* Trigger button */}
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

      {/* Dropdown panel - Simple absolute positioning */}
      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-[9999] mt-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl",
            "transition-all duration-150 ease-out",
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2"
          )}
        >
          {/* Search input */}
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

          {/* List */}
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

export default function DailySalesForm({ redirectTo = "/employee/sales" } = {}) {
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
    watch,
    setValue,
    handleSubmit,
    reset,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = form;

  const watchedFields = watch();
  const isProduct = watchedFields.saleType === "product";

  // 🔍 আইডি দিয়ে ম্যাপ করে একটিভ ক্যাটাগরি/প্রোডাক্ট অবজেক্ট বের করা
  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c._id === watchedFields.categoryId);
  }, [watchedFields.categoryId, categories]);

  const selectedProductObj = useMemo(() => {
    return products.find((p) => p._id === watchedFields.productId);
  }, [watchedFields.productId, products]);

  const isClientDetailsRequired =
    !isProduct && selectedCategoryObj
      ? mandatoryCategories.includes(selectedCategoryObj.name)
      : false;

  // 🧾 আইটেম সিলেক্ট হলেই কমিশনের হার জানা যায় — তখনই মেমোতে কমিশন রো দেখানো হয়
  const hasItem = isProduct ? !!selectedProductObj : !!selectedCategoryObj;

  // 🔀 সেল টাইপ টগল — আইটেম-স্পেসিফিক ফিল্ডগুলো ক্লিয়ার করে ক্লিন স্লেট দেয়
  const handleModeChange = (mode) => {
    if (mode === watchedFields.saleType) return;
    setValue("saleType", mode);
    setValue("categoryId", "");
    setValue("productId", "");
    setValue("productName", "");
    setValue("totalPrice", 0);
    setValue("rawExpense", 0);
    setValue("quantity", 1);
    clearErrors();
    trigger();
  };

  const handleCategorySelect = (v) => {
    setValue("categoryId", v, { shouldValidate: true });
    const selectedCategory = categories.find((cat) => cat._id === v);
    if (selectedCategory) {
      setValue("productName", selectedCategory.name, { shouldValidate: true });
    }
  };

  const handleProductSelect = (v) => {
    setValue("productId", v, { shouldValidate: true });
    const p = products.find((x) => x._id === v);
    if (p) {
      const qty = Number(watchedFields.quantity) || 1;
      setValue("productName", p.name, { shouldValidate: true });
      setValue("totalPrice", Number(p.saleRate || 0) * qty, {
        shouldValidate: true,
      });
      setValue("rawExpense", Number(p.buyRate || 0) * qty, {
        shouldValidate: true,
      });
    }
  };

  // Real-time Complex Validation logic
  useEffect(() => {
    // ক) কাস্টমার ডাটা ভ্যালিডেশন (শুধু সার্ভিসের ম্যান্ডেটরি ক্যাটাগরিতে)
    if (isClientDetailsRequired) {
      if (
        !watchedFields.customerName ||
        watchedFields.customerName.trim().length < 2
      ) {
        setError("customerName", {
          type: "custom",
          message: `Name is required for ${selectedCategoryObj?.name}`,
        });
      } else {
        clearErrors("customerName");
      }

      if (
        !watchedFields.customerPhone ||
        watchedFields.customerPhone.trim().length < 11
      ) {
        setError("customerPhone", {
          type: "custom",
          message: "Valid 11-digit phone number is required",
        });
      } else {
        clearErrors("customerPhone");
      }
    } else {
      clearErrors(["customerName", "customerPhone"]);
    }

    // খ) পেইড বনাম প্রাইস (উভয় মোডেই প্রযোজ্য)
    if (Number(watchedFields.paidAmount) > Number(watchedFields.totalPrice)) {
      setError("paidAmount", {
        type: "custom",
        message: "Paid amount cannot exceed Total Price",
      });
    } else {
      clearErrors("paidAmount");
    }

    if (isProduct) {
      // গ) স্টক চেক — কোয়ান্টিটি স্টকের বেশি হতে পারবে না
      const stock = Number(selectedProductObj?.stock ?? 0);
      const qty = Number(watchedFields.quantity) || 0;
      if (selectedProductObj && qty > stock) {
        setError("quantity", {
          type: "custom",
          message: `Only ${stock} in stock`,
        });
      } else {
        clearErrors("quantity");
      }
      // প্রোডাক্ট মোডে সার্ভিস-অনলি হিউরিস্টিক এরর ক্লিয়ার (নিচে বিক্রি/লস অ্যালাউড)
      clearErrors(["totalPrice", "rawExpense"]);
    } else {
      // ঘ) প্রাইস বনাম কোয়ান্টিটি (সার্ভিস হিউরিস্টিক)
      if (watchedFields.totalPrice < watchedFields.quantity) {
        setError("totalPrice", {
          type: "custom",
          message: `Total price cannot be less than quantity (${watchedFields.quantity} pcs)`,
        });
      } else {
        clearErrors("totalPrice");
      }

      // ঙ) খরচ বনাম প্রাইস (সার্ভিস)
      if (watchedFields.rawExpense > watchedFields.totalPrice) {
        setError("rawExpense", {
          type: "custom",
          message: "Expense cannot exceed Total Price",
        });
      } else {
        clearErrors("rawExpense");
      }
    }
  }, [
    watchedFields.saleType,
    watchedFields.quantity,
    watchedFields.totalPrice,
    watchedFields.rawExpense,
    watchedFields.paidAmount,
    watchedFields.customerName,
    watchedFields.customerPhone,
    isProduct,
    isClientDetailsRequired,
    selectedCategoryObj,
    selectedProductObj,
    setError,
    clearErrors,
  ]);

  // 🔁 প্রোডাক্ট মোডে কোয়ান্টিটি বদলালে প্রাইস ও কস্ট রিকম্পিউট (saleRate/buyRate × qty)
  useEffect(() => {
    if (isProduct && selectedProductObj) {
      const qty = Number(watchedFields.quantity) || 0;
      setValue("totalPrice", Number(selectedProductObj.saleRate || 0) * qty, {
        shouldValidate: true,
      });
      setValue("rawExpense", Number(selectedProductObj.buyRate || 0) * qty, {
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProduct, watchedFields.quantity, selectedProductObj]);

  // Memoized calculations
  const calculations = useMemo(() => {
    const total = Number(watchedFields.totalPrice) || 0;
    const paid = Number(watchedFields.paidAmount) || 0;
    const qty = Number(watchedFields.quantity) || 0;
    const due = Math.max(total - paid, 0);

    if (isProduct) {
      // প্রোডাক্ট: কস্ট = buyRate × qty, কমিশন = প্রোডাক্টের commission% × সেল প্রাইস
      // (সার্ভিসের মতোই মডেল; সার্ভার-ই চূড়ান্ত হিসাব করে, এটা শুধু ডিসপ্লে)
      const cost = Number(selectedProductObj?.buyRate || 0) * qty;
      const commPct = Number(selectedProductObj?.commission || 0);
      const commission = Math.round((total * commPct) / 100);
      const totalExpense = cost + commission;
      const netProfit = Math.round(total - totalExpense);
      return {
        total,
        cost,
        expense: 0,
        totalExpense,
        netProfit,
        commPct,
        commission,
        due,
        isProduct: true,
      };
    }

    // সার্ভিস: ক্যাটাগরি কমিশন + ম্যানুয়াল খরচ (অপরিবর্তিত)
    const initialExpense = Number(watchedFields.rawExpense) || 0;
    const commPct = Number(selectedCategoryObj?.commission || 0);
    const commission = Math.round((total * commPct) / 100);
    const totalExpense = initialExpense + commission;
    const netProfit = Math.round(total - totalExpense);

    return {
      total,
      cost: 0,
      expense: initialExpense,
      totalExpense,
      netProfit,
      commPct,
      commission,
      due,
      isProduct: false,
    };
  }, [
    isProduct,
    watchedFields.totalPrice,
    watchedFields.rawExpense,
    watchedFields.paidAmount,
    watchedFields.quantity,
    selectedCategoryObj,
    selectedProductObj,
  ]);

  // Auto-Payment Logic for 'Due'
  useEffect(() => {
    const total = Number(watchedFields.totalPrice) || 0;
    const paid = Number(watchedFields.paidAmount) || 0;
    const currentDue = Math.max(total - paid, 0);

    if (currentDue > 0 && paid === 0) {
      setValue("paymentMethod", "Due", { shouldValidate: true });
    } else if (watchedFields.paymentMethod === "Due" && paid > 0) {
      setValue("paymentMethod", "Cash", { shouldValidate: true });
    }
  }, [
    watchedFields.totalPrice,
    watchedFields.paidAmount,
    watchedFields.paymentMethod,
    setValue,
  ]);

  // Sync Drafts
  useEffect(() => {
    const saved = localStorage.getItem("sales_draft");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach((key) =>
        setValue(key, parsed[key], { shouldValidate: true }),
      );
    }
  }, [setValue]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem("sales_draft", JSON.stringify(value));
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
      // 🔄 পেলোড সেল টাইপ অনুযায়ী তৈরি হয়; সেলার ইনফো ব্যাকএন্ড সেশন থেকে আসে
      const payload =
        data.saleType === "product"
          ? {
              saleType: "product",
              productId: data.productId,
              productName: data.productName,
              quantity: data.quantity,
              totalPrice: data.totalPrice,
              rawExpense:
                Number(selectedProductObj?.buyRate || 0) *
                (Number(data.quantity) || 0),
              paymentMethod: data.paymentMethod,
              paidAmount: data.paidAmount,
              customerName: data.customerName,
              customerPhone: data.customerPhone,
              note: data.note,
            }
          : {
              saleType: "service",
              categoryId: data.categoryId,
              productName: data.productName,
              quantity: data.quantity,
              totalPrice: data.totalPrice,
              rawExpense: data.rawExpense,
              paymentMethod: data.paymentMethod,
              paidAmount: data.paidAmount,
              customerName: data.customerName,
              customerPhone: data.customerPhone,
              note: data.note,
            };

      const response = await axios.post("/api/products/sales", payload);
      toast.success(response.data.message || "Sale recorded.");
      localStorage.removeItem("sales_draft");
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
                {isProduct
                  ? "Sell an item from inventory - stock and cost applied automatically."
                  : "Record a service. Commission is set on the category."}
              </p>
            </div>

            {/* Top Buttons */}
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
                  : "Review sale (Ctrl+Enter)"}
              </Button>
            </div>
          </header>

          {/* Main Inputs Form */}
          <main className="col-span-12 lg:col-span-8 space-y-6 md:space-y-10">
            {/* Sale type toggle: Service | Product */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  Sale Type
                </span>
              </div>
              <div
                role="group"
                aria-label="Sale type"
                className="inline-flex w-full gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 backdrop-blur-md p-1"
              >
                {[
                  { key: "service", label: "Service", Icon: Wrench },
                  { key: "product", label: "Product", Icon: Package },
                ].map(({ key, label, Icon }) => {
                  const active = watchedFields.saleType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleModeChange(key)}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 px-4 h-9 rounded-full text-xs font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      )}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Client & Order Details */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-sm font-bold tracking-wider text-zinc-600 dark:text-zinc-300 uppercase">
                  Customer & Item
                </h2>
              </div>
              <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs overflow-visible relative z-20">
                <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <label className={CAPTION}>
                      Customer Name{" "}
                      {isClientDetailsRequired ? "*" : "(Optional)"}
                    </label>
                    <Input
                      className="h-11 md:h-10"
                      {...register("customerName")}
                      placeholder={
                        isClientDetailsRequired
                          ? "Required for this category"
                          : "John Doe"
                      }
                    />
                    {errors.customerName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className={CAPTION}>
                      Phone {isClientDetailsRequired ? "*" : "(Optional)"}
                    </label>
                    <Input
                      className="h-11 md:h-10"
                      {...register("customerPhone")}
                      placeholder={
                        isClientDetailsRequired
                          ? "Required for this category"
                          : "01xxxxxxxxx"
                      }
                    />
                    {errors.customerPhone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>

                  {/* Selector: Category (service) OR Product (product) */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className={CAPTION}>
                      {isProduct ? "Product *" : "Category *"}
                    </label>
                    {isProduct ? (
                      <SearchableDropdown
                        value={watchedFields.productId}
                        onChange={handleProductSelect}
                        items={activeProducts}
                        loading={loadingProducts}
                        error={!!errors.productId}
                        displayValue={(product) => (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {taka(product.saleRate)} · {Number(product.commission || 0)}% comm ·{" "}
                              {Number(product.stock || 0)} {product.unit || "pcs"} in stock
                            </span>
                          </div>
                        )}
                        displayLabel={(product) => product.name}
                      />
                    ) : (
                      <SearchableDropdown
                        value={watchedFields.categoryId}
                        onChange={handleCategorySelect}
                        items={categories}
                        loading={loadingCategories}
                        error={!!errors.categoryId}
                      />
                    )}
                    {isProduct
                      ? errors.productId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.productId.message}
                          </p>
                        )
                      : errors.categoryId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.categoryId.message}
                          </p>
                        )}
                  </div>
                  <div className="space-y-1.5">
                    <label className={CAPTION}>
                      Product/Service Name *
                    </label>
                    <Input
                      readOnly={isProduct}
                      className={cn(
                        "h-11 md:h-10",
                        isProduct &&
                          "bg-zinc-100 dark:bg-zinc-800/60 cursor-not-allowed",
                      )}
                      {...register("productName")}
                      placeholder="Item name..."
                    />
                    {errors.productName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.productName.message}
                      </p>
                    )}
                  </div>

                  {/* Qty and Price Split Grid (Mobile Friendly - Side by side even on small device) */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8 space-y-1.5">
                      <label className={CAPTION}>
                        Total Price *
                      </label>
                      <Input
                        className="h-11 md:h-10"
                        type="number"
                        step="any"
                        {...register("totalPrice", { valueAsNumber: true })}
                        placeholder="Enter price"
                      />
                      {errors.totalPrice && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.totalPrice.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-4 space-y-1.5">
                      <label className={CAPTION}>
                        Qty *
                      </label>
                      <Input
                        className="h-11 md:h-10"
                        type="number"
                        {...register("quantity", { valueAsNumber: true })}
                        placeholder="1"
                      />
                      {errors.quantity && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.quantity.message}
                        </p>
                      )}
                    </div>
                    {isProduct && selectedProductObj && (
                      <p className="col-span-12 text-[11px] tabular-nums text-zinc-500">
                        Cost {taka(calculations.cost)} ·{" "}
                        {calculations.commPct}% commission ·{" "}
                        {Number(selectedProductObj.stock || 0)} in stock
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Payment Reconciliation */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-sm font-bold tracking-wider text-zinc-600 dark:text-zinc-300 uppercase">
                  Payment
                </h2>
              </div>
              <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xs">
                <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Grid fields responsive breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className={CAPTION}>
                        Method *
                      </label>
                      <Select
                        onValueChange={(v) =>
                          setValue("paymentMethod", v, { shouldValidate: true })
                        }
                        value={watchedFields.paymentMethod || ""}
                      >
                        <SelectTrigger size="4" className="w-full">
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
                        <p className="text-xs text-red-500 mt-1">
                          {errors.paymentMethod.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className={CAPTION}>
                        {isProduct ? "Cost of goods (auto)" : "Expense *"}
                      </label>
                      <Input
                        readOnly={isProduct}
                        className={cn(
                          "h-11 md:h-10",
                          isProduct &&
                            "bg-zinc-100 dark:bg-zinc-800/60 cursor-not-allowed",
                        )}
                        type="number"
                        step="any"
                        {...register("rawExpense", { valueAsNumber: true })}
                        placeholder="0"
                      />
                      {errors.rawExpense && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.rawExpense.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        className={cn(
                          CAPTION,
                          "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        Amount Paid *
                      </label>
                      <Input
                        className="h-11 md:h-10 border-emerald-200 focus:ring-emerald-500/20"
                        type="number"
                        step="any"
                        {...register("paidAmount", { valueAsNumber: true })}
                        placeholder="0"
                      />
                      {errors.paidAmount && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.paidAmount.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={CAPTION}>
                      Transaction Notes
                    </label>
                    <Textarea
                      {...register("note")}
                      placeholder="Optional details..."
                      className="min-h-20 md:min-h-25"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>

          {/* 🧾 Cash memo — sticky on desktop */}
          <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-8">
            <Card className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-xl overflow-visible">
              {/* Perforated top edge */}
              <div
                aria-hidden
                className="h-3 bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800"
                style={PERFORATION}
              />
              <div className="px-6 pb-6">
                {/* Memo head */}
                <div className="flex items-start justify-between gap-3 border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-4">
                  <div className="min-w-0">
                    <p className={CAPTION}>Cash memo</p>
                    <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {watchedFields.productName || "No item selected yet"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    {isProduct ? "Product" : "Service"}
                  </span>
                </div>

                {/* Line item */}
                <p className="pt-4 text-[11px] tabular-nums text-zinc-500">
                  {Number(watchedFields.quantity) || 0}{" "}
                  {(isProduct && selectedProductObj?.unit) || "pcs"} ×{" "}
                  {taka(
                    (Number(watchedFields.quantity) || 0) > 0
                      ? calculations.total / (Number(watchedFields.quantity) || 1)
                      : 0,
                  )}
                </p>

                {/* Deduction ledger — same structure for both sale types */}
                <div className="mt-3 space-y-2.5">
                  <MemoRow label="Subtotal" value={taka(calculations.total)} />
                  {isProduct ? (
                    <MemoRow
                      label="Cost of goods"
                      value={`−${taka(calculations.cost)}`}
                    />
                  ) : (
                    calculations.expense > 0 && (
                      <MemoRow
                        label="Expense"
                        value={`−${taka(calculations.expense)}`}
                      />
                    )
                  )}
                  {hasItem && (
                    <MemoRow
                      label={`Commission (${calculations.commPct}%)`}
                      value={`−${taka(calculations.commission)}`}
                    />
                  )}
                </div>

                {/* Net profit — the one figure that decides the sale */}
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
                {/* Settlement */}
                <div className="mt-5 space-y-2.5 border-t border-dashed border-zinc-300 pt-4 dark:border-zinc-700">
                  <MemoRow
                    label="Paid"
                    value={taka(watchedFields.paidAmount)}
                  />
                  <MemoRow
                    label="Balance due"
                    strong
                    tone={calculations.due > 0 ? "due" : "muted"}
                    value={taka(calculations.due)}
                  />
                  {calculations.due <= 0 &&
                    Number(watchedFields.paidAmount) > 0 && (
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
                <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Invoice number is issued on save
                </p>
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
                {isProduct ? "Product" : "Service"} sale of{" "}
                <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                  {taka(calculations.total)}
                </strong>
                {isProduct
                  ? ` — stock drops by ${Number(watchedFields.quantity) || 0}.`
                  : "."}{" "}
                An invoice number is issued and reports update right away.
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
