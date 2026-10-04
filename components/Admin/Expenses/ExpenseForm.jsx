"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  AlertCircle,
  ReceiptText,
  Building2,
  Home,
  User,
  Package,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InPlaceCategorySelect } from "@/components/ui/InPlaceCategorySelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useExpenseCategories } from "@/lib/hooks/expenses/useExpenseCategories";

const formSchema = z.object({
  title: z.string().min(2, "Expense title is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  categoryId: z.string().min(1, "Category is required"),
  expenseDate: z.date({ required_error: "Expense date is required" }),
  note: z.string().optional(),
});

const SCOPE_META = {
  Business: { icon: Building2, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  Household: { icon: Home, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  Personal: { icon: User, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
  Other: { icon: Package, color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800" },
};

// ─── ExpenseForm ─────────────────────────────────────────────────────────────

export function ExpenseForm({
  mode = "create",
  expense = null,
  open = false,
  onOpenChange = () => {},
  onSuccess = () => {},
  onCreateExpense = () => {},
  onUpdateExpense = () => {},
}) {
  const [loading, setLoading] = useState(false);

  const { data: categoriesData } = useExpenseCategories();
  const categories = categoriesData?.data || [];

  // Auto-detected scope based on selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    expense?.categoryId || ""
  );
  const selectedCategory = categories.find(
    (cat) => cat._id === selectedCategoryId
  );
  const autoScope = selectedCategory?.type || "Business";

  const defaultValues = expense
    ? {
        title: expense.title || "",
        amount: expense.amount?.toString() || "",
        categoryId: expense.categoryId || "",
        expenseDate: expense.expenseDate ? new Date(expense.expenseDate) : new Date(),
        note: expense.note || "",
      }
    : {
        title: "",
        amount: "",
        categoryId: "",
        expenseDate: new Date(),
        note: "",
      };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setSelectedCategoryId(expense?.categoryId || "");
    }
  }, [expense, open]);

  const ScopeIcon = SCOPE_META[autoScope]?.icon || Package;
  const scopeColor = SCOPE_META[autoScope]?.color || SCOPE_META.Other.color;

  const scopeLabel = selectedCategory
    ? `${autoScope} scope auto-applied from category`
    : "Scope auto-detected from selected category";

  const onSubmit = async (values) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("amount", values.amount);
      formData.append("categoryId", values.categoryId);
      formData.append("expenseDate", format(values.expenseDate, "yyyy-MM-dd"));
      formData.append("note", values.note || "");
      formData.append("expenseScope", autoScope);

      if (mode === "create") {
        await onCreateExpense(formData);
      } else {
        await onUpdateExpense({ id: expense._id, formData });
      }

      reset(defaultValues);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is already handled by the mutation hook with toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">
              {mode === "create" ? "Record Expense" : "Edit Expense"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {mode === "create"
              ? "Add a new expense to your ledger."
              : "Update this expense record."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Expense Title *</Label>
            <Input
              id="title"
              placeholder="August Electricity Bill, Office Rent, Groceries..."
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (৳) *</Label>
              <Input
                id="amount"
                placeholder="2500"
                type="number"
                step="0.01"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2 flex flex-col">
              <Label>Expense Date *</Label>
              <Controller
                control={control}
                name="expenseDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMM yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.expenseDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.expenseDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Category — custom searchable dropdown */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <InPlaceCategorySelect
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setSelectedCategoryId(v);
                  }}
                  categories={categories}
                  error={!!errors.categoryId}
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories found"
                />
              )}
            />
            {errors.categoryId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Auto-detected scope */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs">
            <ScopeIcon className={cn("h-3.5 w-3.5", scopeColor)} />
            <span className="text-muted-foreground">{scopeLabel}</span>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Additional details or remarks..."
              className="min-h-[70px]"
              {...register("note")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === "create"
                  ? "Recording..."
                  : "Updating..."
                : mode === "create"
                ? "Record Expense"
                : "Update Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
