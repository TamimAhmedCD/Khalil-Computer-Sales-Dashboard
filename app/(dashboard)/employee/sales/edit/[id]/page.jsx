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
  Receipt,
  ShieldCheck,
} from "lucide-react";

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
// 1. Next.js এর useParams হুক ইমপোর্ট করা হয়েছে URL থেকে ID নেওয়ার জন্য
import { useParams, useRouter } from "next/navigation";

const formSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  productName: z.string().min(2, "Product or service name is required"),
  categoryId: z.string().min(1, "Please select a category"),
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
});

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank", "Due"];
const mandatoryCategories = [
  "DCR",
  "Khajna Payment",
  "Namjari",
  "Khajna Nibondon",
  "Ticket Payment",
];

const bdtFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

// 2. props থেকে saleData সম্পূর্ণ রিমুভ করা হয়েছে
export default function UpdateSalesForm({ onSuccess }) {
  const route = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 3. URL থেকে সরাসরি ডাইনামিক id নেওয়া হচ্ছে (যেমন: /sales/[id])
  const params = useParams();
  const saleId = params?.id;

  // 4. API থেকে সরাসরি নির্দিষ্ট ID এর ডেটা ফেচ করার কুয়েরি
  const { data: saleData, isLoading: loadingSaleData } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: async () => {
      if (!saleId) return null;
      const { data } = await axios.get(`/api/products/sales/${saleId}`);
      // আপনার API রেসপন্স এর স্ট্রাকচার অনুযায়ী data?.data অথবা শুধু data রিটার্ন করুন
      return data?.data || data;
    },
    enabled: !!saleId, // ID না পাওয়া পর্যন্ত এই API কল হবে না
  });
  // Fetch Categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products/categories");
      return data?.data || [];
    },
  });

  // React Hook Form Setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      customerName: "",
      customerPhone: "",
      productName: "",
      categoryId: "",
      quantity: 1,
      totalPrice: 0,
      rawExpense: 0,
      paymentMethod: "",
      paidAmount: 0,
      note: "",
      invoiceNumber: "",
    },
  });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    trigger,
    setError,
    clearErrors,
    reset,
    formState: { errors, isValid },
  } = form;

  const watchedFields = watch();

  // 5. API থেকে ডেটা সফলভাবে আসার পর ফর্মের ইনপুটগুলো আপডেট করা হচ্ছে
  useEffect(() => {
    if (saleData) {
      reset({
        customerName: saleData.customerName || "",
        customerPhone: saleData.customerPhone || "",
        productName: saleData.productName || "",
        quantity: saleData.quantity || 1,
        totalPrice: saleData.total || saleData.totalPrice || 0,
        rawExpense: saleData.rawExpense || 0,
        paymentMethod: saleData.paymentMethod || "",
        paidAmount: saleData.paidAmount || 0,
        note: saleData.note || "",
        invoiceNumber: saleData.invoiceNumber || "",
        categoryId: watchedFields.categoryId,
      });
    }
  }, [saleData, reset, watchedFields.categoryId]);

  // DB থেকে আসা ক্যাটাগরি নামের সাথে ক্যাটাগরি লিস্টের ID ম্যাপ করা
  useEffect(() => {
    if (categories.length > 0 && saleData?.category) {
      const matchedCategory = categories.find(
        (cat) => cat.name.toLowerCase() === saleData.category.toLowerCase(),
      );
      if (matchedCategory) {
        setValue("categoryId", matchedCategory._id, { shouldValidate: true });
      }
    }
  }, [categories, saleData, setValue]);

  // একটিভ ক্যাটাগরির অবজেক্ট বের করা
  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c._id === watchedFields.categoryId);
  }, [watchedFields.categoryId, categories]);

  const isClientDetailsRequired = selectedCategoryObj
    ? mandatoryCategories.includes(selectedCategoryObj.name)
    : false;

  // Real-time Complex Validation logic
  useEffect(() => {
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

    if (watchedFields.totalPrice < watchedFields.quantity) {
      setError("totalPrice", {
        type: "custom",
        message: `Total price cannot be less than quantity (${watchedFields.quantity} pcs)`,
      });
    } else {
      clearErrors("totalPrice");
    }

    if (watchedFields.rawExpense > watchedFields.totalPrice) {
      setError("rawExpense", {
        type: "custom",
        message: "Raw expense cannot exceed Total Price",
      });
    } else {
      clearErrors("rawExpense");
    }

    if (watchedFields.paidAmount > watchedFields.totalPrice) {
      setError("paidAmount", {
        type: "custom",
        message: "Paid amount cannot exceed Total Price",
      });
    } else {
      clearErrors("paidAmount");
    }
  }, [
    watchedFields.quantity,
    watchedFields.totalPrice,
    watchedFields.rawExpense,
    watchedFields.paidAmount,
    watchedFields.customerName,
    watchedFields.customerPhone,
    isClientDetailsRequired,
    selectedCategoryObj,
    setError,
    clearErrors,
  ]);

  // Memoized calculations
  const calculations = useMemo(() => {
    const total = Number(watchedFields.totalPrice) || 0;
    const initialExpense = Number(watchedFields.rawExpense) || 0; // আগের মূল খরচ
    const paid = Number(watchedFields.paidAmount) || 0;

    // ১. আগের খরচের ওপর ভিত্তি করে প্রাথমিক লাভ (যার ওপর কমিশন হিসাব হবে)
    const commPct = selectedCategoryObj?.commission || 0;

    // ২. কমিশন হিসাব এবং রাউন্ড করা
    const commission = Math.round((total * commPct) / 100);

    // ৩. আগের মূল খরচের সাথে কমিশন যোগ করে ফাইনাল totalExpense বের করা
    const totalExpense = initialExpense + commission;

    // ৪. মোট টাকা থেকে ফাইনাল খরচ (কমিশনসহ) বাদ দিয়ে Net Profit বের করা
    const netProfit = Math.round(total - totalExpense);

    const due = Math.max(total - paid, 0);

    // সবশেষে অবজেক্টে আপডেট হওয়া ভ্যালুগুলো রিটার্ন করা
    return { total, totalExpense, netProfit, commPct, commission, due };
  }, [
    watchedFields.totalPrice,
    watchedFields.rawExpense,
    watchedFields.paidAmount,
    selectedCategoryObj,
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

  const handlePreSubmit = (e) => {
    e.preventDefault();
    trigger();
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors || !isValid) {
      toast.error(
        "Please clear validation barriers before attempting final submission.",
      );
      return;
    }
    setShowConfirm(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // 6. ডাইনামিক saleId দিয়ে ডেটা আপডেট পাঠানো হচ্ছে
      const response = await axios.patch(`/api/products/sales/${saleId}`, data);
      toast.success(
        response.data.message || "Transaction successfully updated!",
      );
      setShowConfirm(false);
      if (onSuccess) onSuccess();
      route.push("/employee/sales");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Update failed");
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
          toast.error("Form parameters validation check failed.");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isValid, errors]);

  // 7. API থেকে মেইন ডেটা লোড হওয়ার সময়ের ক্লিয়ার ইন্ডিকেটর স্টেট
  if (loadingSaleData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-zinc-500 tracking-wider">
            Fetching transaction from server...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
      <div className="max-w-350 mx-auto px-4 py-4 md:py-10 pb-24 md:pb-10">
        <form
          onSubmit={handlePreSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start"
        >
          {/* Header */}
          <header className="col-span-12 flex flex-col sm:flex-row sm:items-center justify-between pb-4 md:pb-8 border-b border-zinc-200 dark:border-zinc-800 gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold mb-1 uppercase tracking-widest text-[9px] md:text-[10px]">
                <ShieldCheck size={14} /> Secured Sales Portal
              </div>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
                Update Transaction
              </h1>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <Button
                size="lg"
                type="button"
                variant="outline"
                onClick={() => reset()}
                className="px-8 h-12 rounded-xl"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={
                  !isValid || Object.keys(errors).length > 0 || isSubmitting
                }
                className="px-8 h-12 rounded-xl font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              >
                {!isValid || Object.keys(errors).length > 0
                  ? "Awaiting Parameters"
                  : "Update Sale (Ctrl+Enter)"}
              </Button>
            </div>
          </header>

          {/* Main Inputs Form */}
          <main className="col-span-12 lg:col-span-8 space-y-6 md:space-y-10">
            {/* Section 1: Client & Order Details */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <User size={18} className="text-zinc-500" />
                <h2 className="text-base md:text-lg font-medium">
                  Client & Order Details
                </h2>
              </div>
              <Card className="shadow-sm rounded-xl md:rounded-2xl">
                <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
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
                    <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
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

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
                      Product/Service Name *
                    </label>
                    <Input
                      className="h-11 md:h-10"
                      {...register("productName")}
                      placeholder="Item name..."
                    />
                    {errors.productName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.productName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                      Category *
                    </label>
                    <Select
                      disabled={loadingCategories}
                      onValueChange={(v) =>
                        setValue("categoryId", v, { shouldValidate: true })
                      }
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
                    {errors.categoryId && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8 space-y-1.5">
                      <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
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
                      <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
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
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Payment Reconciliation */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <CreditCard size={18} className="text-zinc-500" />
                <h2 className="text-base md:text-lg font-medium">
                  Payment Reconciliation
                </h2>
              </div>
              <Card className="shadow-sm rounded-xl md:rounded-2xl">
                <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
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
                      <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
                        Expense Cost *
                      </label>
                      <Input
                        className="h-11 md:h-10"
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
                      <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
                        Amount Paid *
                      </label>
                      <Input
                        className="h-11 md:h-10"
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
                    <label className="text-[10px] md:text-[11px] font-bold uppercase text-zinc-400">
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

          {/* Right Invoice Card */}
          <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            <Card className="bg-zinc-900 text-zinc-100 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl md:shadow-2xl">
              <div className="p-5 md:p-8 space-y-6 md:space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] md:text-[10px] uppercase font-bold opacity-40">
                      Invoice Reference
                    </p>
                    <h3 className="font-mono text-xs">
                      {watchedFields.invoiceNumber}
                    </h3>
                  </div>
                  <Receipt size={18} className="opacity-40" />
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="opacity-50">Subtotal</span>
                    <span>{bdtFormatter.format(calculations.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="opacity-50">
                      Commission ({calculations.commPct}%)
                    </span>
                    <span className="text-blue-400">
                      {bdtFormatter.format(calculations.commission)}
                    </span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs md:text-sm opacity-50">
                      Net Profit
                    </span>
                    <span
                      className={`text-2xl md:text-3xl font-bold ${calculations.netProfit < 0 ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {bdtFormatter.format(calculations.netProfit)}
                    </span>
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] md:text-[10px] uppercase font-bold opacity-40">
                        Balance Due
                      </p>
                      <p
                        className={`text-lg md:text-xl font-bold ${calculations.due > 0 ? "text-orange-400" : "text-zinc-500"}`}
                      >
                        {bdtFormatter.format(calculations.due)}
                      </p>
                    </div>
                    {calculations.due <= 0 &&
                      Number(watchedFields.paidAmount) > 0 && (
                        <BadgeCheck size={24} className="text-emerald-500" />
                      )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    !isValid || Object.keys(errors).length > 0 || isSubmitting
                  }
                  className="w-full h-12 md:h-14 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed hidden sm:inline-flex justify-center items-center"
                >
                  {!isValid || Object.keys(errors).length > 0
                    ? "Form Incomplete"
                    : "Update Sale"}
                </Button>
              </div>
            </Card>
          </aside>

          {/* Mobile Floating Bottom Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 z-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              className="w-1/3 h-12 rounded-xl text-xs"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={
                !isValid || Object.keys(errors).length > 0 || isSubmitting
              }
              className="w-2/3 h-12 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            >
              {!isValid || Object.keys(errors).length > 0
                ? "Awaiting Input"
                : "Review Updates"}
            </Button>
          </div>
        </form>

        {/* Confirmation Modal */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="w-[90%] max-w-100 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Updates?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to update this transaction record to{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {bdtFormatter.format(calculations.total)}
                </strong>
                . The changes will sync instantly.
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
                {isSubmitting ? "Updating..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
