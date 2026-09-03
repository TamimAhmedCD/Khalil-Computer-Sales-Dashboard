"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Package,
  Box,
  Tag,
  TrendingUp,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ImageIcon,
} from "lucide-react";
import { useEmployeeProducts } from "@/lib/hooks/products/useEmployeeProducts";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function EmployeeProductList({ isCollapsed }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value === "all" ? "" : value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-48 bg-white/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 h-9 text-xs rounded-lg">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {products.map((product) => {
                const productImage = product.images?.[0]?.url;
                return (
                  <Card
                    key={product._id}
                    className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border-zinc-200/80 dark:border-zinc-800/50 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/60 shadow-sm hover:shadow-md group"
                  >
                    {/* Product Image */}
                    <div className="relative w-full h-48 bg-zinc-100 dark:bg-zinc-800/40 rounded-t-2xl overflow-hidden">
                      {productImage ? (
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-1.5"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
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

        {/* Product Details Modal - Respects sidebar width */}
        {selectedProduct && (
          <div
            className={cn(
              "fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in duration-200 bg-black/40 dark:bg-black/60 transition-all duration-500",
              isCollapsed ? "md:left-20" : "md:left-64",
              "left-0" // Mobile full width
            )}
          >
            <Card className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl transform scale-100 animate-in zoom-in-95 duration-150 text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Product Details
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                    SKU: {selectedProduct._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProduct(null)}
                  className="h-7 w-7 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  ✕
                </Button>
              </div>

              <div className="p-5 space-y-5">
                {/* Product Images Gallery */}
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProduct.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <Image
                          src={img.url}
                          alt={`${selectedProduct.name} - Image ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, 200px"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-1">
                    {selectedProduct.name}
                  </h3>
                  {selectedProduct.brand && (
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      by {selectedProduct.brand}
                    </p>
                  )}
                </div>

                {selectedProduct.description && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Description</p>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Sale Price</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">৳{selectedProduct.saleRate.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Stock Level</p>
                    <p className={`text-lg font-black font-mono ${selectedProduct.stock <= (selectedProduct.lowStockAlert || 5) ? "text-red-600 dark:text-red-500" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {selectedProduct.stock} {selectedProduct.unit || "pcs"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-xl flex items-center gap-3">
                  <Tag className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Category</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedProduct.categoryName || "Uncategorized"}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 h-9 text-xs font-semibold rounded-lg transition-all"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Close Details
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
