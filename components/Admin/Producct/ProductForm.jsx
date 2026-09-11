"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { AlertCircle, ChevronLeft, Package, Save, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const schema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(100, "Product name is too long"),
  categoryId: z.string().min(1, "Please select a category"),
  brand: z.string().max(50, "Brand name is too long").optional(),
  description: z.string().max(1000, "Description is too long").optional(),
  buyRate: z
    .number({ invalid_type_error: "Enter a valid numeric buy rate", required_error: "Buy rate is required" })
    .min(0, "Buy rate cannot be negative")
    .max(9999999, "Buy rate is too high"),
  saleRate: z
    .number({ invalid_type_error: "Enter a valid numeric sale rate", required_error: "Sale rate is required" })
    .min(0, "Sale rate cannot be negative")
    .max(9999999, "Sale rate is too high"),
  commission: z
    .number({ invalid_type_error: "Enter a valid commission percentage" })
    .min(0, "Commission cannot be negative")
    .max(100, "Commission cannot exceed 100%"),
  stock: z
    .number({ invalid_type_error: "Enter a valid stock quantity" })
    .min(0, "Stock cannot be negative")
    .int("Stock must be a whole number"),
  lowStockAlert: z
    .number({ invalid_type_error: "Enter a valid alert quantity" })
    .min(0, "Alert quantity cannot be negative")
    .int("Alert quantity must be a whole number"),
  unit: z.string().min(1, "Unit is required"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
}).refine(data => data.saleRate >= data.buyRate, {
  message: "Selling price should generally be higher than cost price",
  path: ["saleRate"],
});

const emptyValues = {
  name: "",
  categoryId: "",
  brand: "",
  description: "",
  buyRate: 0,
  saleRate: 0,
  commission: 0,
  stock: 0,
  lowStockAlert: 0,
  unit: "pcs",
  isActive: true,
  isFeatured: false,
};

const Taka = () => <span className="font-hind-siliguri">৳</span>;

/**
 * Shared create/edit product form.
 * - mode: "create" | "edit"
 * - initialValues: partial field values (edit)
 * - initialImages: [{ url }] already on the product (edit)
 * - onSubmit(formData, { reset, addAnother }): parent runs the mutation
 */
export default function ProductForm({
  mode = "create",
  initialValues,
  initialImages = [],
  submitting = false,
  onSubmit,
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const addAnotherRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { ...emptyValues, ...initialValues },
  });

  // Categories (reuse the existing categories collection)
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products/categories");
      return data?.data || [];
    },
  });

  // --- Images: existing (edit, removable) + newly picked files ---
  const [existingImages, setExistingImages] = useState(initialImages || []);
  const [newImages, setNewImages] = useState([]); // { file, preview }

  const newImagesRef = useRef(newImages);
  useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);
  useEffect(
    () => () =>
      newImagesRef.current.forEach(
        (n) => n.preview && URL.revokeObjectURL(n.preview),
      ),
    [],
  );

  const totalImages = existingImages.length + newImages.length;

  const addImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    if (totalImages >= MAX_IMAGES) {
      toast.error(`You can add up to ${MAX_IMAGES} images`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Each image must be 5MB or smaller");
      return;
    }
    setNewImages((prev) => [
      ...prev,
      { file, preview: URL.createObjectURL(file) },
    ]);
  };

  const removeExisting = (url) =>
    setExistingImages((prev) => prev.filter((i) => i.url !== url));

  const removeNew = (index) =>
    setNewImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });

  // Derived profit (no state, no effect)
  const buyRate = watch("buyRate");
  const saleRate = watch("saleRate");
  const commission = watch("commission");
  const profit =
    (Number.isFinite(saleRate) ? saleRate : 0) -
    (Number.isFinite(buyRate) ? buyRate : 0);

  // Commission is a % of the sale price, deducted on every sale (same as service categories)
  const commissionAmount = Math.round(
    ((Number.isFinite(saleRate) ? saleRate : 0) *
      (Number.isFinite(commission) ? commission : 0)) /
      100,
  );

  const onValid = (values) => {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("categoryId", values.categoryId);
    fd.append("brand", values.brand || "");
    fd.append("description", values.description || "");
    fd.append("buyRate", String(values.buyRate));
    fd.append("saleRate", String(values.saleRate));
    fd.append("commission", String(values.commission ?? 0));
    fd.append("stock", String(values.stock ?? 0));
    fd.append("lowStockAlert", String(values.lowStockAlert ?? 0));
    fd.append("unit", values.unit || "pcs");
    fd.append("isActive", String(values.isActive));
    fd.append("isFeatured", String(values.isFeatured));
    if (isEdit) {
      fd.append(
        "keepImages",
        JSON.stringify(existingImages.map((i) => i.url)),
      );
    }
    newImages.forEach((n) => fd.append("images", n.file));

    onSubmit?.(fd, {
      addAnother: addAnotherRef.current,
      reset: () => {
        reset(emptyValues);
        newImages.forEach((n) => n.preview && URL.revokeObjectURL(n.preview));
        setNewImages([]);
        setExistingImages([]);
      },
    });
  };

  const onInvalid = () => {
    toast.error("Please fix the highlighted fields before saving.");
  };

  const leave = () => router.push("/admin/products");

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={leave}
            variant="outline"
            size="icon"
            aria-label="Back to products"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {isEdit ? "Edit product" : "Add product"}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isEdit
                  ? "Update details, pricing, stock, and images."
                  : "Create a product with pricing, stock, and images."}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={leave}
            disabled={submitting}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() => (addAnotherRef.current = false)}
            disabled={submitting}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {submitting
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Save product"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Product Details */}
          <section>
            <div className="mb-4">
              <h3 className="text-base font-medium">Product details</h3>
              <p className="text-sm text-muted-foreground mt-1">Basic information about the product</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Product name</Label>
                <Input
                  id="name"
                  className={cn(errors.name && "border-destructive")}
                  {...register("name")}
                  placeholder="e.g. Logitech MX Master 3S"
                />
                {errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <SearchableDropdown
                  value={watch("categoryId") || ""}
                  onChange={(v) =>
                    setValue("categoryId", v, { shouldValidate: true })
                  }
                  items={categories}
                  loading={loadingCategories}
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories found"
                  icon={Package}
                  error={!!errors.categoryId}
                />
                {errors.categoryId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  className={cn(errors.brand && "border-destructive")}
                  {...register("brand")}
                  placeholder="Optional"
                />
                {errors.brand && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.brand.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  className={cn(errors.description && "border-destructive")}
                  {...register("description")}
                  placeholder="Short description of the product"
                  className="min-h-[110px] resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <div className="mb-4">
              <h3 className="text-base font-medium">Pricing</h3>
              <p className="text-sm text-muted-foreground mt-1">Set pricing and commission</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buyRate">Buy rate</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Taka />
                  </span>
                  <Input
                    id="buyRate"
                    type="number"
                    step="any"
                    min={0}
                    className={cn("pl-7", errors.buyRate && "border-destructive")}
                    {...register("buyRate", { valueAsNumber: true })}
                  />
                </div>
                {errors.buyRate && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.buyRate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleRate">Sale rate</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Taka />
                  </span>
                  <Input
                    id="saleRate"
                    type="number"
                    step="any"
                    min={0}
                    className={cn("pl-7", errors.saleRate && "border-destructive")}
                    {...register("saleRate", { valueAsNumber: true })}
                  />
                </div>
                {errors.saleRate && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.saleRate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (%)</Label>
                <div className="relative">
                  <Input
                    id="commission"
                    type="number"
                    step="any"
                    min={0}
                    className={cn("pr-8", errors.commission && "border-destructive")}
                    {...register("commission", { valueAsNumber: true })}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                {errors.commission ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.commission.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    ≈ <Taka />
                    {commissionAmount.toLocaleString("en-BD")} per unit sold at
                    the current sale rate
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Profit summary</Label>
                <div className="pt-2 text-sm space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Estimated profit</span>
                    <span className={profit < 0 ? "text-destructive font-medium" : "text-emerald-600 dark:text-emerald-400 font-medium"}>
                      <Taka />{Number(profit || 0).toLocaleString("en-BD")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>After commission</span>
                    <span><Taka />{Number(profit - commissionAmount || 0).toLocaleString("en-BD")}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Images */}
          <section>
            <div className="mb-4">
              <h3 className="text-base font-medium">Images</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Up to {MAX_IMAGES} images, 5MB each. The first image is used as the thumbnail.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existingImages.map((img) => (
                <div
                  key={img.url}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-transparent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt="Product"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExisting(img.url)}
                    aria-label="Remove image"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow ring-1 ring-border transition-colors hover:bg-destructive hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {newImages.map((n, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-transparent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.preview}
                    alt="New product"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNew(i)}
                    aria-label="Remove image"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow ring-1 ring-border transition-colors hover:bg-destructive hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {totalImages < MAX_IMAGES && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={addImage}
                  />
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">Add image</span>
                </label>
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Inventory */}
          <section>
            <div className="mb-4">
              <h3 className="text-base font-medium">Inventory</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage stock and units</p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    placeholder="0"
                    className={cn(errors.stock && "border-destructive")}
                    {...register("stock", { valueAsNumber: true })}
                  />
                  {errors.stock && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.stock.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={watch("unit") || "pcs"}
                    onValueChange={(v) => setValue("unit", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pcs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pcs</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockAlert">Low stock alert</Label>
                <Input
                  id="lowStockAlert"
                  type="number"
                  min={0}
                  placeholder="Warn when stock drops to…"
                  className={cn(errors.lowStockAlert && "border-destructive")}
                  {...register("lowStockAlert", { valueAsNumber: true })}
                />
                {errors.lowStockAlert && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lowStockAlert.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Visibility */}
          <section>
            <div className="mb-4">
              <h3 className="text-base font-medium">Visibility</h3>
              <p className="text-sm text-muted-foreground mt-1">Control product display</p>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Available for sale
                  </p>
                </div>
                <Switch
                  checked={watch("isActive")}
                  onCheckedChange={(v) => setValue("isActive", v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-5">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">
                    Highlight in the grid
                  </p>
                </div>
                <Switch
                  checked={watch("isFeatured")}
                  onCheckedChange={(v) => setValue("isFeatured", v)}
                />
              </div>
            </div>
          </section>

          {!isEdit && (
            <Button
              type="submit"
              onClick={() => (addAnotherRef.current = true)}
              disabled={submitting}
              variant="outline"
              className="w-full"
            >
              Save & add another
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
