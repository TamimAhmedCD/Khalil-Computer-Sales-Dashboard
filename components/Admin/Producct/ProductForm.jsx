"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Package, Save, Upload, X } from "lucide-react";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  categoryId: z.string().min(1, "Please select a category"),
  brand: z.string().optional(),
  description: z.string().optional(),
  buyRate: z
    .number({ invalid_type_error: "Enter a valid buy rate" })
    .min(0, "Cannot be negative"),
  saleRate: z
    .number({ invalid_type_error: "Enter a valid sale rate" })
    .min(0, "Cannot be negative"),
  commission: z
    .number({ invalid_type_error: "Enter a valid commission" })
    .min(0, "Cannot be negative"),
  stock: z
    .number({ invalid_type_error: "Enter a valid quantity" })
    .min(0, "Cannot be negative"),
  lowStockAlert: z
    .number({ invalid_type_error: "Enter a valid quantity" })
    .min(0, "Cannot be negative"),
  unit: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
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
 * - initialImages: [{ url, publicId }] already on the product (edit)
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

  const removeExisting = (publicId) =>
    setExistingImages((prev) => prev.filter((i) => i.publicId !== publicId));

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
        JSON.stringify(existingImages.map((i) => i.publicId)),
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Product details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Product name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g. Logitech MX Master 3S"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  disabled={loadingCategories}
                  value={watch("categoryId") || ""}
                  onValueChange={(v) =>
                    setValue("categoryId", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingCategories ? "Loading…" : "Select category"
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
                  <p className="text-xs text-destructive">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  {...register("brand")}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Short description of the product"
                  className="min-h-[110px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Profit is sale rate minus buy rate. Commission is a percentage
                of the sale price, deducted on every sale.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    className="pl-7"
                    {...register("buyRate", { valueAsNumber: true })}
                  />
                </div>
                {errors.buyRate && (
                  <p className="text-xs text-destructive">
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
                    className="pl-7"
                    {...register("saleRate", { valueAsNumber: true })}
                  />
                </div>
                {errors.saleRate && (
                  <p className="text-xs text-destructive">
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
                    className="pr-8"
                    {...register("commission", { valueAsNumber: true })}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                {errors.commission ? (
                  <p className="text-xs text-destructive">
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
                <Label>Estimated profit</Label>
                <div className="flex h-9 items-center rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3">
                  <span
                    className={`text-sm font-semibold ${
                      profit < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <Taka />
                    {Number(profit || 0).toLocaleString("en-BD")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  After commission: <Taka />
                  {Number(profit - commissionAmount || 0).toLocaleString(
                    "en-BD",
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Up to {MAX_IMAGES} images, 5MB each. The first image is used as
                the thumbnail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {existingImages.map((img) => (
                  <div
                    key={img.publicId}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
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
                      onClick={() => removeExisting(img.publicId)}
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
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
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
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
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
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Inventory */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register("stock", { valueAsNumber: true })}
                  />
                  {errors.stock && (
                    <p className="text-xs text-destructive">
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
                  {...register("lowStockAlert", { valueAsNumber: true })}
                />
                {errors.lowStockAlert && (
                  <p className="text-xs text-destructive">
                    {errors.lowStockAlert.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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
            </CardContent>
          </Card>

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
