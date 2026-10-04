"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Package,
  Box,
  Tag,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  SlidersHorizontal,
  X,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { UnifiedSelect } from "@/components/ui/UnifiedSelect";
import { useEmployeeProducts } from "@/lib/hooks/products/useEmployeeProducts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FormattedText } from "@/components/ui/FormattedText";
import { Badge } from "@/components/ui/badge";

export function EmployeeProductList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoSwapping, setIsAutoSwapping] = useState(true);

  // Reset image index when product changes
  useEffect(() => {
    if (selectedProduct) {
      setCurrentImageIndex(0);
      setIsAutoSwapping(true);
    }
  }, [selectedProduct]);

  // Auto-swap images in dialog every 3 seconds
  useEffect(() => {
    if (!selectedProduct?.images || selectedProduct.images.length <= 1 || !isAutoSwapping) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === selectedProduct.images.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedProduct, isAutoSwapping]);

  // Navigate to next image
  const nextImage = () => {
    if (selectedProduct?.images) {
      setIsAutoSwapping(false);
      setCurrentImageIndex((prev) =>
        prev === selectedProduct.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Navigate to previous image
  const prevImage = () => {
    if (selectedProduct?.images) {
      setIsAutoSwapping(false);
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedProduct.images.length - 1 : prev - 1
      );
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, stockFilter, sortBy]);

  const { data, isLoading, isError, error } = useEmployeeProducts({
    search: debouncedSearch,
    category,
    page: currentPage,
  });

  const products = data?.data?.products || [];
  const categories = data?.data?.categories || [];
  const summary = data?.data?.summary || { totalStock: 0, activeProducts: 0, totalValue: 0 };
  const pagination = data?.data?.pagination || { totalPages: 1, currentPage: 1, totalResults: 0 };

  // Client-side filtering and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply stock filter
    if (stockFilter !== "all") {
      filtered = filtered.filter((product) => {
        const stock = product.stock || 0;
        const lowStockAlert = product.lowStockAlert || 5;

        if (stockFilter === "in") return stock > lowStockAlert;
        if (stockFilter === "low") return stock > 0 && stock <= lowStockAlert;
        if (stockFilter === "out") return stock <= 0;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (b.saleRate || 0) - (a.saleRate || 0);
        case "stock":
          return (b.stock || 0) - (a.stock || 0);
        case "profit":
          const profitA = (a.saleRate || 0) - (a.buyRate || 0) - (a.expense || 0);
          const profitB = (b.saleRate || 0) - (b.buyRate || 0) - (b.expense || 0);
          return profitB - profitA;
        case "name":
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

    return filtered;
  }, [products, stockFilter, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm.trim() !== "" || category !== "" || stockFilter !== "all" || sortBy !== "name";

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("");
    setStockFilter("all");
    setSortBy("name");
    setCurrentPage(1);
  };

  // Calculate low stock count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const stock = p.stock || 0;
      const lowStockAlert = p.lowStockAlert || 5;
      return stock <= lowStockAlert;
    }).length;
  }, [products]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse available products, check stock levels, and view details.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active products
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {summary.activeProducts}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Items in catalog</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Low / out of stock
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <p className={cn(
                  "mt-2 text-2xl font-bold tracking-tight",
                  lowStockCount > 0 && "text-amber-600 dark:text-amber-400"
                )}>
                  {lowStockCount}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {lowStockCount > 0 ? "Needs restocking soon" : "All levels healthy"}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total stock units
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {summary.totalStock.toLocaleString()}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Units in inventory</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Box className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total inventory value
              </p>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  ৳{summary.totalValue.toLocaleString()}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Stock × sale price</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <div>
                <h2 className="font-semibold leading-none">Filters</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Search and refine your product list.
                </p>
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit gap-2"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, brand, or description…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <CategorySelect
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  setCurrentPage(1);
                }}
                categories={categories}
                includeAllCategories={true}
                allCategoriesLabel="All categories"
                placeholder="All categories"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <UnifiedSelect
                value={stockFilter}
                onChange={setStockFilter}
                searchable={false}
                items={[
                  { id: "all", name: "All stock" },
                  { id: "in", name: "In stock" },
                  { id: "low", name: "Low stock" },
                  { id: "out", name: "Out of stock" },
                ]}
                placeholder="All stock"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort by</label>
              <UnifiedSelect
                value={sortBy}
                onChange={setSortBy}
                searchable={false}
                items={[
                  { id: "name", name: "Name (A–Z)" },
                  { id: "price", name: "Price (high → low)" },
                  { id: "stock", name: "Stock (high → low)" },
                  { id: "profit", name: "Profit (high → low)" },
                ]}
                placeholder="Name"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{filteredAndSortedProducts.length}</span>{" "}
            product{filteredAndSortedProducts.length !== 1 ? "s" : ""} found
          </p>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="space-y-4">
        {isError ? (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-destructive">Failed to load products</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error ? error.message : "Could not fetch product data."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No products found</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "No products match your current filters."
                    : "There are currently no products available."}
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredAndSortedProducts.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-medium">{filteredAndSortedProducts.length}</span> of <span className="text-foreground font-medium">{pagination.totalResults}</span> products
              {hasActiveFilters && <span className="ml-1">(filtered)</span>}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="flex max-h-[90dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {selectedProduct && (
            <>
              {/* Sticky header */}
              <div className="flex-none border-b px-6 py-4">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4 pr-6">
                    <div className="min-w-0">
                      <DialogTitle className="truncate text-lg">
                        {selectedProduct.name}
                      </DialogTitle>
                      <DialogDescription className="mt-0.5">
                        {selectedProduct.categoryName || "Uncategorized"}
                        {selectedProduct.brand ? ` · ${selectedProduct.brand}` : ""}
                      </DialogDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        selectedProduct.stock <= 0
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent"
                          : selectedProduct.stock <= (selectedProduct.lowStockAlert || 5)
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
                      )}
                    >
                      {selectedProduct.stock <= 0
                        ? "Out of Stock"
                        : selectedProduct.stock <= (selectedProduct.lowStockAlert || 5)
                        ? "Low Stock"
                        : "In Stock"}
                    </Badge>
                  </div>
                </DialogHeader>
              </div>

              {/* Scrollable body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  {/* Product Images Carousel */}
                  {selectedProduct.images && selectedProduct.images.length > 0 && (
                    <div className="relative">
                      <div className="relative w-full aspect-video overflow-hidden rounded-lg border bg-muted">
                        <AnimatePresence mode="wait">
                          {selectedProduct.images.map((img, idx) => (
                            currentImageIndex === idx && (
                              <motion.div
                                key={`${selectedProduct._id}-${idx}`}
                                initial={{ x: 400, opacity: 0 }}
                                animate={{
                                  x: 0,
                                  opacity: 1,
                                  transition: {
                                    x: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                                    opacity: { duration: 0.5, ease: "easeOut" }
                                  }
                                }}
                                exit={{
                                  x: -400,
                                  opacity: 0,
                                  transition: {
                                    x: { duration: 0.5, ease: [0.64, 0, 0.78, 0] },
                                    opacity: { duration: 0.4, ease: "easeIn" }
                                  }
                                }}
                                className="absolute inset-0"
                              >
                                <Image
                                  src={img.url}
                                  alt={`${selectedProduct.name} - Image ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="600px"
                                  priority={idx === 0}
                                />
                              </motion.div>
                            )
                          ))}
                        </AnimatePresence>

                        {/* Navigation arrows */}
                        {selectedProduct.images.length > 1 && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-lg"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-lg"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>

                            {/* Image counter */}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <button
                                onClick={() => setIsAutoSwapping(!isAutoSwapping)}
                                className="rounded-full bg-black/70 dark:bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80 dark:hover:bg-white/30 transition-colors"
                              >
                                {isAutoSwapping ? "⏸ Pause" : "▶ Auto"}
                              </button>
                              <div className="rounded-full bg-black/70 dark:bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                {currentImageIndex + 1} / {selectedProduct.images.length}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Thumbnail Navigation */}
                      {selectedProduct.images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                          {selectedProduct.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentImageIndex(idx);
                                setIsAutoSwapping(false);
                              }}
                              className={cn(
                                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                                currentImageIndex === idx
                                  ? "border-primary ring-2 ring-primary/20 scale-105"
                                  : "border-border opacity-60 hover:opacity-100 hover:scale-105"
                              )}
                            >
                              <Image
                                src={img.url}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="rounded-lg border bg-muted/30 px-4 py-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Description
                      </p>
                      <div className="text-sm leading-relaxed text-foreground">
                        <FormattedText text={selectedProduct.description} />
                      </div>
                    </div>
                  )}

                  {/* Pricing grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Buy price
                      </p>
                      <p className="mt-1 text-base font-bold">
                        ৳{selectedProduct.buyRate?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Expense / unit
                      </p>
                      <p className="mt-1 text-base font-bold">
                        ৳{selectedProduct.expense?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Sale price
                      </p>
                      <p className="mt-1 text-base font-bold">
                        ৳{selectedProduct.saleRate.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Stock level
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-base font-bold",
                          selectedProduct.stock <= (selectedProduct.lowStockAlert || 5)
                            ? "text-red-600 dark:text-red-500"
                            : ""
                        )}
                      >
                        {selectedProduct.stock} {selectedProduct.unit || "pcs"}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Category
                      </p>
                      <p className="text-sm font-bold">
                        {selectedProduct.categoryName || "Uncategorized"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onClick }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const images = product.images || [];

  // Auto-swap product card images every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const isLowStock = product.stock <= (product.lowStockAlert || 5);
  const isOutOfStock = product.stock <= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        onClick={onClick}
        className="border-border/70 shadow-sm rounded-lg overflow-hidden cursor-pointer"
      >
        {/* Product Image */}
        <div className="relative w-full h-48 bg-muted">
          {images.length > 0 ? (
            <div className="relative w-full h-full">
              <AnimatePresence mode="wait">
                {images.map((img, idx) => (
                  imageIndex === idx && (
                    <motion.div
                      key={`${product._id}-${idx}`}
                      initial={{ x: 300, opacity: 0 }}
                      animate={{
                        x: 0,
                        opacity: 1,
                        scale: isHovered ? 1.1 : 1,
                        transition: {
                          x: { duration: 0.5, ease: "easeOut" },
                          opacity: { duration: 0.5, ease: "easeOut" },
                          scale: { duration: 0.6, ease: "easeInOut" }
                        }
                      }}
                      exit={{
                        x: -300,
                        opacity: 0,
                        transition: { duration: 0.4, ease: "easeIn" }
                      }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={img.url}
                        alt={`${product.name} - Image ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 rounded-full bg-black/70 dark:bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  {imageIndex + 1} / {images.length}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1 flex-1 pr-4 min-w-0">
              <h3 className="font-bold text-sm truncate">
                {product.name}
              </h3>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {product.brand || "No Brand"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-muted-foreground">
                Price
              </p>
              <p className="text-base font-bold">
                ৳{product.saleRate.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-muted p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground truncate">
                {product.categoryName || "Uncategorized"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Box className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={cn(
                "text-xs font-bold",
                isOutOfStock
                  ? "text-red-600 dark:text-red-500"
                  : isLowStock
                  ? "text-amber-600 dark:text-amber-400"
                  : ""
              )}>
                {product.stock} {product.unit || "pcs"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <p className="text-xs text-muted-foreground truncate">
              ID: {product._id.slice(-6).toUpperCase()}
            </p>
            <motion.div
              whileHover={{ x: 4 }}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
