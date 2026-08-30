"use client";

import { useState, useEffect, useMemo } from "react";
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
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
      {/* 📱 মোবাইল ফ্রেন্ডলি প্যাডিং: ছোট ফোনে py-4, বড় স্ক্রিনে py-10 */}
      <div className="max-w-350 mx-auto px-4 py-4 md:py-10 pb-24 md:pb-10">
        <form
          onSubmit={handlePreSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start"
        >
          {/* Header - Mobile Responsive Flex */}
          <header className="col-span-12 flex flex-col sm:flex-row sm:items-end justify-between pb-4 md:pb-8 border-b border-zinc-200 dark:border-zinc-800 gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                <ShieldCheck size={13} /> Sales desk
              </div>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
                New sale
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {isProduct
                  ? "Sell an item from inventory — stock and cost are applied automatically."
                  : "Record a service. Commission is set on the category."}
              </p>
            </div>

            {/* Top Buttons - Desktop view only (Hidden on Mobile bottom sheet triggers it instead) */}
            <div className="hidden sm:flex items-center gap-3">
              <Button
                size="lg"
                type="button"
                variant="outline"
                onClick={() => reset(DEFAULTS)}
                className="px-8 h-12 rounded-xl"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={
                  !isValid || Object.keys(errors).length > 0 || isSubmitting
                }
                className="px-8 h-12 rounded-xl font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
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
            <div
              role="group"
              aria-label="Sale type"
              className="inline-flex w-full sm:w-auto gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1"
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
                      "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 h-10 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                    )}
                  >
                    <Icon size={15} /> {label}
                  </button>
                );
              })}
            </div>

            {/* Section 1: Client & Order Details */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5 px-1">
                <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                  Customer &amp; item
                </h2>
              </div>
              <Card className="shadow-sm rounded-xl md:rounded-2xl">
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
                      <Select
                        disabled={loadingProducts}
                        onValueChange={handleProductSelect}
                        value={watchedFields.productId || ""}
                      >
                        <SelectTrigger size="4" className="w-full h-11 md:h-10">
                          <SelectValue
                            placeholder={
                              loadingProducts
                                ? "Loading products..."
                                : "Select Product"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {activeProducts.length === 0 ? (
                            <div className="px-2 py-2 text-sm text-zinc-400">
                              No products available
                            </div>
                          ) : (
                            activeProducts.map((p) => (
                              <SelectItem
                                key={p._id}
                                value={p._id}
                                disabled={Number(p.stock) <= 0}
                              >
                                {p.name} — {taka(p.saleRate)} ·{" "}
                                {Number(p.commission || 0)}% comm ·{" "}
                                {Number(p.stock || 0)} {p.unit || "pcs"} in stock
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        disabled={loadingCategories}
                        onValueChange={handleCategorySelect}
                        value={watchedFields.categoryId || ""}
                      >
                        <SelectTrigger size="4" className="w-full h-11 md:h-10">
                          <SelectValue
                            placeholder={
                              loadingCategories
                                ? "Loading categories..."
                                : "Select Category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
              <div className="flex items-center gap-2.5 px-1">
                <CreditCard
                  size={16}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                  Payment
                </h2>
              </div>
              <Card className="shadow-sm rounded-xl md:rounded-2xl">
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

          {/* 🧾 Cash memo — sticky on desktop, collapses under the form on mobile */}
          <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-8">
            <div className="drop-shadow-xl">
              {/* Perforated top edge: the memo's signature detail */}
              <div
                aria-hidden
                className="h-3 bg-white dark:bg-zinc-900"
                style={PERFORATION}
              />
              <div className="rounded-b-2xl border-x border-b border-zinc-200 bg-white px-5 pb-6 md:px-7 md:pb-7 dark:border-zinc-800 dark:bg-zinc-900">
                {/* Memo head */}
                <div className="flex items-start justify-between gap-3 border-b border-dashed border-zinc-300 pb-4 dark:border-zinc-700">
                  <div className="min-w-0">
                    <p className={CAPTION}>Cash memo</p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {watchedFields.productName || "No item selected yet"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
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
                  className="mt-6 hidden h-12 w-full items-center justify-center rounded-xl bg-zinc-900 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {!isValid || Object.keys(errors).length > 0
                    ? "Fill required fields"
                    : "Complete sale"}
                </Button>
                <p className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                  Invoice number is issued on save
                </p>
              </div>
            </div>
          </aside>

          {/* 📱 Mobile Only Floating Bottom Bar (স্ক্রিনের নিচে ফিক্সড থাকবে সহজে প্রেস করার জন্য) */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 z-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(DEFAULTS)}
              className="w-1/3 h-12 rounded-xl text-xs"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={
                !isValid || Object.keys(errors).length > 0 || isSubmitting
              }
              className="w-2/3 h-12 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            >
              {!isValid || Object.keys(errors).length > 0
                ? "Fill required fields"
                : "Review sale"}
            </Button>
          </div>
        </form>

        {/* Confirmation Modal */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="w-[90%] max-w-100 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Record this sale?</AlertDialogTitle>
              <AlertDialogDescription>
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
              <AlertDialogCancel className="w-1/2 mt-0 rounded-xl">
                Review
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isSubmitting}
                onClick={handleSubmit(onSubmit)}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
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
