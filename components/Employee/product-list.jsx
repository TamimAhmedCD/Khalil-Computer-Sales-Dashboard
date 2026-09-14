"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ChevronDown,
  LayoutGrid,
  ImageIcon,
} from "lucide-react";
import { useEmployeeProducts } from "@/lib/hooks/products/useEmployeeProducts";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function EmployeeProductList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoSwapping, setIsAutoSwapping] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

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

  // Auto-swap product card images logic is handled within ProductCard component

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSelectOpen && !event.target.closest('.category-dropdown')) {
        setIsSelectOpen(false);
        setCategorySearch("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelectOpen]);

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

  const { data, isLoading, isError, error } = useEmployeeProducts({
    search: debouncedSearch,
    category,
    page: currentPage,
  });

  const products = data?.data?.products || [];
  const categories = data?.data?.categories || [];
  const summary = data?.data?.summary || { totalStock: 0, activeProducts: 0, totalValue: 0 };
  const pagination = data?.data?.pagination || { totalPages: 1, currentPage: 1, totalResults: 0 };

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen text-zinc-800 dark:text-zinc-100 py-8 transition-colors duration-200 relative">
      {/* Background Ambient */}
      <div className="absolute top-0 left-1/4 w-150 h-75 bg-zinc-200/40 dark:bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-100 h-100 bg-zinc-300/30 dark:bg-zinc-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              Product Inventory
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Browse available products, check stock levels, and view details.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="group bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:bg-white/80 dark:hover:bg-zinc-900/40 shadow-xs">
            <div className="absolute right-3 top-3 text-zinc-300/50 dark:text-zinc-700/20">
              <LayoutGrid className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Active Products
              </p>
              {isLoading ? (
                <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                  {summary.activeProducts}
                </p>
              )}
            </div>
          </Card>

          <Card className="group bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:bg-white/80 dark:hover:bg-zinc-900/40 shadow-xs">
            <div className="absolute right-3 top-3 text-zinc-300/50 dark:text-zinc-700/20">
              <Box className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Total Stock Units
              </p>
              {isLoading ? (
                <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                  {summary.totalStock.toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          <Card className="group bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl rounded-xl border border-zinc-200/80 dark:border-zinc-800/50 p-6 relative overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:bg-white/80 dark:hover:bg-zinc-900/40 shadow-xs">
            <div className="absolute right-3 top-3 text-zinc-300/50 dark:text-zinc-700/20">
              <TrendingUp className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Total Inventory Value
              </p>
              {isLoading ? (
                <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text">
                  ৳{summary.totalValue.toLocaleString()}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-4 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-xl shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder="Search by name, brand, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 pl-9 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-700 h-9 text-xs rounded-lg transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
            {/* Custom Category Dropdown with Search */}
            <div className="relative category-dropdown">
              {/* Dropdown Trigger */}
              <Button
                variant="outline"
                className="w-full md:w-48 bg-white/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 h-9 text-xs rounded-lg justify-between"
                onClick={() => setIsSelectOpen(!isSelectOpen)}
              >
                <span className="truncate">
                  {category
                    ? categories.find((c) => c._id === category)?.name || "Select Category"
                    : "All Categories"}
                </span>
                <ChevronDown className="h-3 w-3 ml-2 flex-shrink-0" />
              </Button>

              {/* Custom Dropdown Menu */}
              {isSelectOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                  {/* Search Input */}
                  <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                      <Input
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="h-7 text-xs pl-8 bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Category List */}
                  <div className="overflow-y-auto flex-1">
                    <button
                      onClick={() => {
                        setCategory("");
                        setCurrentPage(1);
                        setIsSelectOpen(false);
                        setCategorySearch("");
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                        !category
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      All Categories
                    </button>

                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => {
                            setCategory(cat._id);
                            setCurrentPage(1);
                            setIsSelectOpen(false);
                            setCategorySearch("");
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                            category === cat._id
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        No categories found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {isError ? (
            <div className="p-8 rounded-2xl bg-card border border-border/60 text-center space-y-2 shadow-sm">
              <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">Error Loading Products</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {error ? error.message : "Could not fetch product data."}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-sm text-foreground mb-0.5">No Products Found</p>
              <p className="text-xs text-muted-foreground">
                There are currently no products matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && products.length > 0 && (
            <div className="px-2 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Showing <span className="text-foreground font-medium font-mono">{(currentPage - 1) * 12 + 1}</span> to <span className="text-foreground font-medium font-mono">{Math.min(currentPage * 12, pagination.totalResults)}</span> of <span className="text-foreground font-medium font-mono">{pagination.totalResults}</span> products
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-xs border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="h-7 text-xs border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Product Details Modal - Mobile Responsive with Image Carousel */}
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent
            className="w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:max-w-2xl lg:max-w-4xl p-0 gap-0 overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            showCloseButton={false}
          >
            <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Product Details
                  </DialogTitle>
                  {selectedProduct && (
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      SKU: {selectedProduct._id.slice(-8).toUpperCase()}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProduct(null)}
                  className="h-8 w-8 rounded-full flex-shrink-0 ml-2"
                >
                  ✕
                </Button>
              </div>
            </DialogHeader>

            {selectedProduct && (
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
                <div className="space-y-4 sm:space-y-5">
                  {/* Product Images Carousel with Framer Motion - Right to Left Slide */}
                  {selectedProduct.images && selectedProduct.images.length > 0 && (
                    <div className="relative">
                      {/* Main Image Display - Full Width with Slide Animation - Responsive Height */}
                      <div className="relative w-full h-48 sm:h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40">
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
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 600px, 900px"
                                  priority={idx === 0}
                                />
                              </motion.div>
                            )
                          ))}
                        </AnimatePresence>

                        {/* Navigation arrows - only show if multiple images */}
                        {selectedProduct.images.length > 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:bg-white dark:hover:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 z-10"
                            >
                              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:bg-white dark:hover:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 z-10"
                            >
                              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>

                            {/* Image counter and auto-swap indicator */}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <button
                                onClick={() => setIsAutoSwapping(!isAutoSwapping)}
                                className="rounded-full bg-black/70 dark:bg-white/25 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80 dark:hover:bg-white/30 transition-colors"
                              >
                                {isAutoSwapping ? "⏸ Pause" : "▶ Auto"}
                              </button>
                              <div className="rounded-full bg-black/70 dark:bg-white/25 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                {currentImageIndex + 1} / {selectedProduct.images.length}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Thumbnail Navigation - only show if multiple images */}
                      {selectedProduct.images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                          {selectedProduct.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentImageIndex(idx);
                                setIsAutoSwapping(false);
                              }}
                              className={cn(
                                "relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300",
                                currentImageIndex === idx
                                  ? "border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/20 dark:ring-zinc-100/20 scale-105"
                                  : "border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:scale-105"
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

                  {/* Product name and brand */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                      {selectedProduct.name}
                    </h3>
                    {selectedProduct.brand && (
                      <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        by {selectedProduct.brand}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Description
                      </p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Pricing grid - responsive */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Sale Price
                      </p>
                      <p className="font-mono text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                        ৳{selectedProduct.saleRate.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Stock Level
                      </p>
                      <p
                        className={`font-mono text-base sm:text-lg font-black ${
                          selectedProduct.stock <= (selectedProduct.lowStockAlert || 5)
                            ? "text-red-600 dark:text-red-500"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {selectedProduct.stock} {selectedProduct.unit || "pcs"}
                      </p>
                    </div>
                  </div>

                  {/* Category tag */}
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Category
                      </p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedProduct.categoryName || "Uncategorized"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Product Card Component with Auto-Swapping Images and Framer Motion Animations
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

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        onClick={onClick}
        className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border-zinc-200/80 dark:border-zinc-800/50 rounded-2xl relative overflow-hidden shadow-sm cursor-pointer"
      >
        {/* Product Image Carousel with Framer Motion */}
        <div className="relative w-full h-48 bg-zinc-100 dark:bg-zinc-800/40 rounded-t-2xl overflow-hidden">
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
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              {/* Image counter */}
              {images.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-2 right-2 rounded-full bg-black/70 dark:bg-white/30 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                >
                  {imageIndex + 1} / {images.length}
                </motion.div>
              )}

              {/* Next image indicator */}
              {images.length > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-2 right-2"
                >
                  <div className="flex space-x-1">
                    {images.map((_, idx) => (
                      <motion.div
                        key={idx}
                        animate={{
                          scale: imageIndex === idx ? 1.2 : 1,
                          backgroundColor: imageIndex === idx
                            ? "rgba(0, 0, 0, 0.8)"
                            : "rgba(0, 0, 0, 0.3)"
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}
        </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 flex-1 pr-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {product.brand || "No Brand"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
              Price
            </p>
            <p className="text-base font-black text-zinc-900 dark:text-zinc-100 font-mono">
              ৳{product.saleRate.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              {product.categoryName || "Uncategorized"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Box className="h-3.5 w-3.5 text-zinc-400" />
            <span className={`text-[11px] font-bold font-mono ${product.stock <= (product.lowStockAlert || 5) ? "text-red-600 dark:text-red-500" : "text-zinc-900 dark:text-zinc-100"}`}>
              {product.stock} {product.unit || "pcs"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono line-clamp-1">
            ID: {product._id.slice(-6).toUpperCase()}
          </p>
          <motion.div
            whileHover={{ x: 4 }}
            className="h-7 w-7 flex items-center justify-center text-zinc-400"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </div>
      </div>
    </Card>
    </motion.div>
  );
}
