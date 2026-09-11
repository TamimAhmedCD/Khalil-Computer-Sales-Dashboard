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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
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

// ─── Custom Searchable Category Dropdown ────────────────────────────────────

function CategorySearchSelect({ value, onChange, categories, error }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false); // drives CSS animation
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = categories.find((c) => c._id === value);

  // Filter categories by search term
  const filtered = search.trim()
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.type.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  // Open → wait a tick so the element is in the DOM, then set mounted=true to trigger animation
  const handleOpen = () => {
    setOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
        searchRef.current?.focus();
      });
    });
  };

  // Close → unmount animation first, then remove from DOM
  const handleClose = () => {
    setMounted(false);
    setTimeout(() => {
      setOpen(false);
      setSearch("");
    }, 200); // matches transition duration
  };

  const handleToggle = () => {
    if (open) handleClose();
    else handleOpen();
  };

  const handleSelect = (cat) => {
    onChange(cat._id);
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
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm",
          "ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "hover:bg-accent/40",
          error ? "border-destructive" : "border-input",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-[10px] h-4 shrink-0">
              {selected.type}
            </Badge>
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Select category</span>
        )}
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel — rendered in DOM when open, animated by mounted flag */}
      {open && (
        <div
          role="listbox"
          className={cn(
            // layout
            "fixed z-[9999] mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md",
            // animation base
            "transition-all duration-200 ease-out origin-top",
            // enter state (mounted=true) / exit state (mounted=false)
            mounted
              ? "opacity-100 scale-y-100 translate-y-0"
              : "opacity-0 scale-y-95 -translate-y-1"
          )}
          style={{
            top: containerRef.current?.getBoundingClientRect().bottom + 4,
            left: containerRef.current?.getBoundingClientRect().left,
            width: containerRef.current?.getBoundingClientRect().width,
          }}
        >
          {/* Search input */}
          <div className="sticky top-0 z-10 border-b bg-popover px-2 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full rounded-sm border border-input bg-background py-1.5 pl-8 pr-3 text-xs",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                )}
              />
            </div>
          </div>

          {/* List */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No categories found
              </div>
            ) : (
              filtered.map((cat) => {
                const isSelected = cat._id === value;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm text-left",
                      "transition-colors duration-100",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/60 font-medium"
                    )}
                  >
                    <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                      {cat.type}
                    </Badge>
                    <span className="flex-1 truncate">{cat.name}</span>
                    {isSelected && (
                      <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            <AlertDialogTitle className="text-lg">
              {mode === "create" ? "Record Expense" : "Edit Expense"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {mode === "create"
              ? "Add a new expense to your ledger."
              : "Update this expense record."}
          </AlertDialogDescription>
        </AlertDialogHeader>

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
                <CategorySearchSelect
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setSelectedCategoryId(v);
                  }}
                  categories={categories}
                  error={!!errors.categoryId}
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

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === "create"
                  ? "Recording..."
                  : "Updating..."
                : mode === "create"
                ? "Record Expense"
                : "Update Expense"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
