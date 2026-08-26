"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

import { Card } from "@/components/ui/card";
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
import {
  AlertCircle,
  ChevronLeft,
  ImageIcon,
  LinkIcon,
  PlusCircle,
  Save,
  Upload,
} from "lucide-react";
import { useAddProduct } from "@/lib/hooks/products/useAddProduct";

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

const defaultValues = {
  name: "",
  categoryId: "",
  brand: "",
  description: "",
  buyRate: 0,
  saleRate: 0,
  stock: 0,
  lowStockAlert: 0,
  unit: "pcs",
  isActive: true,
  isFeatured: false,
};

export default function AddProductPage() {
  const router = useRouter();
  const addProduct = useAddProduct();
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
    defaultValues,
  });

  // Fetch categories (reuse the existing categories collection)
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get("/api/products/categories");
      return data?.data || [];
    },
  });

  // --- Images: keep the real File objects + object-URL previews ---
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const previewsRef = useRef([]);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);
  useEffect(
    () => () => previewsRef.current.forEach((u) => u && URL.revokeObjectURL(u)),
    [],
  );

  const handleImageChange = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev];
      if (next[index]) URL.revokeObjectURL(next[index]);
      next[index] = URL.createObjectURL(file);
      return next;
    });
  };

  const clearImages = () => {
    previews.forEach((u) => u && URL.revokeObjectURL(u));
    setImageFiles([]);
    setPreviews([]);
  };

  // --- Derived profit (no state, no effect) ---
  const buyRate = watch("buyRate");
  const saleRate = watch("saleRate");
  const profit =
    (Number.isFinite(saleRate) ? saleRate : 0) -
    (Number.isFinite(buyRate) ? buyRate : 0);

  const onValid = (values) => {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("categoryId", values.categoryId);
    fd.append("brand", values.brand || "");
    fd.append("description", values.description || "");
    fd.append("buyRate", String(values.buyRate));
    fd.append("saleRate", String(values.saleRate));
    fd.append("stock", String(values.stock ?? 0));
    fd.append("lowStockAlert", String(values.lowStockAlert ?? 0));
    fd.append("unit", values.unit || "pcs");
    fd.append("isActive", String(values.isActive));
    fd.append("isFeatured", String(values.isFeatured));
    imageFiles.forEach((file) => file && fd.append("images", file));

    addProduct.mutate(fd, {
      onSuccess: () => {
        reset(defaultValues);
        clearImages();
        if (!addAnotherRef.current) router.push("/admin/products");
      },
    });
  };

  const onInvalid = () => {
    toast.error("Please fix the highlighted fields before saving.");
  };

  const submitting = addProduct.isPending;

  return (
    <form
      onSubmit={handleSubmit(onValid, onInvalid)}
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8"
    >
      {/* --- Page Header --- */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-zinc-200 dark:border-zinc-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
              Add Product
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Inventory Management / New Asset
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            variant="outline"
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() => (addAnotherRef.current = false)}
            disabled={submitting}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 gap-2"
          >
            <Save className="h-4 w-4" /> {submitting ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: CORE INFO --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* Product Information */}
          <Card className="rounded-[2rem] p-8 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-zinc-400">
              Asset Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Product Name
                </Label>
                <Input
                  {...register("name")}
                  placeholder="Enter product name..."
                  className="rounded-xl h-12 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Category
                </Label>
                <Select
                  disabled={loadingCategories}
                  value={watch("categoryId") || ""}
                  onValueChange={(v) =>
                    setValue("categoryId", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    size="4"
                    className="rounded-xl h-12 w-full bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                  >
                    <SelectValue
                      placeholder={
                        loadingCategories ? "Loading..." : "Select category"
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
                  <p className="text-xs text-red-500 ml-1">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Brand (Optional)
                </Label>
                <Input
                  {...register("brand")}
                  placeholder="Brand name"
                  className="rounded-xl h-12"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Description
                </Label>
                <Textarea
                  {...register("description")}
                  placeholder="Describe the asset features..."
                  className="rounded-xl min-h-[120px] resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Pricing Card */}
          <Card className="rounded-[2rem] p-8 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-zinc-400">
              Financial Valuation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Buy Rate (Cost)
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-hind-siliguri text-xl">
                    ৳
                  </span>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    {...register("buyRate", { valueAsNumber: true })}
                    className="rounded-xl h-12 pl-8"
                  />
                </div>
                {errors.buyRate && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.buyRate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Sale Rate (Price)
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-hind-siliguri text-xl">
                    ৳
                  </span>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    {...register("saleRate", { valueAsNumber: true })}
                    className="rounded-xl h-12 pl-8"
                  />
                </div>
                {errors.saleRate && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.saleRate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Estimated Profit
                </Label>
                <div className="h-12 flex items-center px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <span
                    className={`text-sm font-black ${profit < 0 ? "text-red-500" : "text-emerald-600"}`}
                  >
                    <span className="font-hind-siliguri">৳</span>
                    {profit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Material / Uploads */}
          <Card className="rounded-[2rem] p-8 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-zinc-400">
              Documentation & Assets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Drop PDF/Docs here
                  </p>
                  <p className="text-[9px] font-medium text-zinc-400 mt-1">
                    Maximum 10MB per file
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Cloud Storage Link
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Paste Drive/Dropbox link"
                      className="rounded-xl h-12 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Material Notes
                  </Label>
                  <Input
                    placeholder="Internal storage codes..."
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: STATUS & MEDIA --- */}
        <div className="space-y-8">
          {/* Images Section */}
          <Card className="rounded-[2rem] p-8 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-zinc-400">
              Media Nodes
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {/* MAIN IMAGE (click upload) */}
              <label className="col-span-2 aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden relative">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageChange(e, 0)}
                />

                {previews[0] ? (
                  <img
                    src={previews[0]}
                    alt="Product image 1"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlusCircle className="h-8 w-8 text-zinc-400" />
                )}
              </label>

              {/* IMAGE 1 */}
              <label className="aspect-square rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageChange(e, 1)}
                />

                {previews[1] ? (
                  <img
                    src={previews[1]}
                    alt="Product image 2"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-zinc-300" />
                )}
              </label>

              {/* IMAGE 2 */}
              <label className="aspect-square rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageChange(e, 2)}
                />

                {previews[2] ? (
                  <img
                    src={previews[2]}
                    alt="Product image 3"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-zinc-300" />
                )}
              </label>
            </div>
          </Card>

          {/* Inventory Section */}
          <Card className="rounded-[2rem] p-8 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-zinc-400">
              Inventory Status
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Initial Stock
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    {...register("stock", { valueAsNumber: true })}
                    placeholder="0"
                    className="rounded-xl h-12"
                  />
                  {errors.stock && (
                    <p className="text-xs text-red-500 ml-1">
                      {errors.stock.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Unit Type
                  </Label>
                  <Select
                    value={watch("unit") || "pcs"}
                    onValueChange={(v) => setValue("unit", v)}
                  >
                    <SelectTrigger size="4" className="rounded-xl h-12 w-full">
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
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Low Stock Alert
                </Label>
                <div className="relative">
                  <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                  <Input
                    type="number"
                    min={0}
                    {...register("lowStockAlert", { valueAsNumber: true })}
                    placeholder="Warn at qty..."
                    className="rounded-xl h-12"
                  />
                  {errors.lowStockAlert && (
                    <p className="text-xs text-red-500 ml-1">
                      {errors.lowStockAlert.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Visibility Section */}
          <Card className="rounded-[2rem] p-8 border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-900/30 text-white shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-zinc-500">
              Asset Protocol
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Active Status
                  </p>
                  <p className="text-[9px] text-zinc-500 font-medium">
                    Visible to users
                  </p>
                </div>
                <Switch
                  checked={watch("isActive")}
                  onCheckedChange={(v) => setValue("isActive", v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Featured Asset
                  </p>
                  <p className="text-[9px] text-zinc-500 font-medium">
                    Top of grid view
                  </p>
                </div>
                <Switch
                  checked={watch("isFeatured")}
                  onCheckedChange={(v) => setValue("isFeatured", v)}
                />
              </div>
            </div>
          </Card>

          {/* Bottom Actions for Mobile */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              onClick={() => (addAnotherRef.current = true)}
              disabled={submitting}
              className="w-full rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] h-14 bg-white text-black hover:bg-zinc-100"
            >
              {submitting ? "Saving..." : "Save & Add Another"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
