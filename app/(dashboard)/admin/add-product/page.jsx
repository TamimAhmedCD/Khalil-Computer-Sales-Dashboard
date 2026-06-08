"use client";

import React, { useState, useEffect } from "react";
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

export default function AddProductPage() {
  const [pricing, setPricing] = useState({
    buyRate: 0,
    saleRate: 0,
    profit: 0,
  });
  const [images, setImages] = useState([]);

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    const updatedImages = [...images];
    updatedImages[index] = imageUrl;
    setImages(updatedImages);
  };

  // Auto-calculate profit when rates change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPricing((prev) => ({
      ...prev,
      profit: prev.saleRate - prev.buyRate,
    }));
  }, [pricing.buyRate, pricing.saleRate]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      {/* --- Page Header --- */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
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
            variant="outline"
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6"
          >
            Cancel
          </Button>
          <Button className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 gap-2">
            <Save className="h-4 w-4" /> Save Product
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
                  placeholder="Enter product name..."
                  className="rounded-xl h-12 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Category
                </Label>
                <Select>
                  <SelectTrigger
                    size="4"
                    className="rounded-xl h-12 w-full bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="home">Home & Living</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Brand (Optional)
                </Label>
                <Input placeholder="Brand name" className="rounded-xl h-12" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Description
                </Label>
                <Textarea
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
                    className="rounded-xl h-12 pl-8"
                    onChange={(e) =>
                      setPricing({
                        ...pricing,
                        buyRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
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
                    className="rounded-xl h-12 pl-8"
                    onChange={(e) =>
                      setPricing({
                        ...pricing,
                        saleRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Estimated Profit
                </Label>
                <div className="h-12 flex items-center px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-sm font-black text-emerald-600">
                    <span className="font-hind-siliguri">৳</span>
                    {pricing.profit.toLocaleString()}
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

                {images[0] ? (
                  <img src={images[0]} className="w-full h-full object-cover" />
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

                {images[1] ? (
                  <img src={images[1]} className="w-full h-full object-cover" />
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

                {images[2] ? (
                  <img src={images[2]} className="w-full h-full object-cover" />
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
                    placeholder="0"
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Unit Type
                  </Label>
                  <Select>
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
                    placeholder="Warn at qty..."
                    className="rounded-xl h-12"
                  />
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
                <Switch className="data-[state=checked]:bg-emerald-500" />
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
                <Switch />
              </div>
            </div>
          </Card>

          {/* Bottom Actions for Mobile */}
          <div className="flex flex-col gap-3 pt-4">
            <Button className="w-full rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] h-14 bg-white text-black hover:bg-zinc-100">
              Save & Add Another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
