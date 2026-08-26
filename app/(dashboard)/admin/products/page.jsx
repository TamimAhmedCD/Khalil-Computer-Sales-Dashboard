"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Package, PackageX, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import Header from "@/components/Admin/Producct/Header";
import SummaryCards from "@/components/Admin/Producct/SummaryCards";
import FilterSection from "@/components/Admin/Producct/FilterSection";
import TableView from "@/components/Admin/Producct/TableView";
import InventoryGrid from "@/components/Admin/Producct/GridView";

import { useProducts } from "@/lib/hooks/products/useProducts";
import { useDeleteProduct } from "@/lib/hooks/products/useDeleteProduct";

const ITEMS_PER_PAGE = 8;

const STATUS_STYLES = {
  "In Stock":
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  "Low Stock":
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  "Out of Stock":
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent",
};

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const deriveStatus = (stock, lowStockAlert) => {
  if (stock <= 0) return "Out of Stock";
  if (lowStockAlert > 0 && stock <= lowStockAlert) return "Low Stock";
  return "In Stock";
};

const normalize = (p) => {
  const stock = Number(p.stock) || 0;
  const lowStockAlert = Number(p.lowStockAlert) || 0;
  const costPrice = Number(p.buyRate) || 0;
  const sellingPrice = Number(p.saleRate) || 0;
  return {
    id: p._id,
    name: p.name || "Untitled product",
    category: p.categoryName || "Uncategorized",
    image: p.images?.[0]?.url || null,
    images: Array.isArray(p.images) ? p.images : [],
    costPrice,
    sellingPrice,
    profit: Number.isFinite(p.profit) ? p.profit : sellingPrice - costPrice,
    stock,
    unit: p.unit || "pcs",
    brand: p.brand || "",
    description: p.description || "",
    lowStockAlert,
    status: deriveStatus(stock, lowStockAlert),
  };
};

export default function ProductsPage() {
  const router = useRouter();
  const {
    data: rawProducts,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useProducts();
  const deleteProduct = useDeleteProduct();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const products = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts.map(normalize) : []),
    [rawProducts],
  );

  // Reset to the first page whenever a filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockFilter, sortBy]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );

  // KPIs — computed across the full dataset, not the filtered view
  const kpis = useMemo(() => {
    const lowStock = products.filter(
      (p) => p.status === "Low Stock" || p.status === "Out of Stock",
    ).length;
    const inventoryValue = products.reduce(
      (sum, p) => sum + p.sellingPrice * p.stock,
      0,
    );
    const potentialProfit = products.reduce(
      (sum, p) => sum + p.profit * p.stock,
      0,
    );
    return {
      totalProducts: products.length,
      lowStock,
      inventoryValue,
      potentialProfit,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term);
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && p.status === "In Stock") ||
        (stockFilter === "low" && p.status === "Low Stock") ||
        (stockFilter === "out" && p.status === "Out of Stock");
      return matchesSearch && matchesCategory && matchesStock;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return b.sellingPrice - a.sellingPrice;
        case "stock":
          return b.stock - a.stock;
        case "profit":
          return b.profit - a.profit;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, searchTerm, categoryFilter, stockFilter, sortBy]);

  const totalPages = Math.max(
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
    1,
  );
  const page = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    categoryFilter !== "all" ||
    stockFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("name");
  };

  const handleExport = () => {
    const rows = [
      [
        "Name",
        "Category",
        "Brand",
        "Cost Price",
        "Selling Price",
        "Profit",
        "Stock",
        "Unit",
        "Status",
      ],
      ...filteredProducts.map((p) => [
        p.name,
        p.category,
        p.brand,
        p.costPrice,
        p.sellingPrice,
        p.profit,
        p.stock,
        p.unit,
        p.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? "");
            return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const goToAdd = () => router.push("/admin/add-product");
  const goToEdit = (product) =>
    router.push(`/admin/products/edit/${product.id}`);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProduct.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setSelectedProduct((current) =>
          current?.id === deleteTarget.id ? null : current,
        );
      },
    });
  };

  return (
    <>
      <div className="space-y-8">
        <Header
          onAdd={goToAdd}
          onExport={handleExport}
          canExport={products.length > 0}
        />

        {isLoading ? (
          <ProductsSkeleton />
        ) : isError ? (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-destructive">
                  Failed to load products
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Something went wrong while fetching your inventory.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No products yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add your first product to start tracking stock, pricing, and
                  profit.
                </p>
              </div>
              <Button onClick={goToAdd} className="gap-2">
                <Package className="h-4 w-4" />
                Add product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <SummaryCards
              totalProducts={kpis.totalProducts}
              lowStock={kpis.lowStock}
              inventoryValue={kpis.inventoryValue}
              potentialProfit={kpis.potentialProfit}
              formatCurrency={formatCurrency}
            />
            <FilterSection
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              categories={categoryOptions}
              totalResults={filteredProducts.length}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          </>
        )}
      </div>

      {!isLoading && !isError && products.length > 0 && (
        <div className="mt-8">
          {filteredProducts.length === 0 ? (
            <Card className="border-border/70 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <PackageX className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No matching products</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    No products match your current search and filters.
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === "table" ? (
            <TableView
              products={paginatedProducts}
              currentPage={page}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              onView={setSelectedProduct}
              onEdit={goToEdit}
              onDelete={setDeleteTarget}
              formatCurrency={formatCurrency}
            />
          ) : (
            <InventoryGrid
              products={paginatedProducts}
              onView={setSelectedProduct}
              onEdit={goToEdit}
              onDelete={setDeleteTarget}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      )}

      {/* Quick view */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  {selectedProduct.category}
                  {selectedProduct.brand ? ` · ${selectedProduct.brand}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {selectedProduct.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={STATUS_STYLES[selectedProduct.status]}
                  >
                    {selectedProduct.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Cost price
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrency(selectedProduct.costPrice)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Selling price
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrency(selectedProduct.sellingPrice)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Profit / unit
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedProduct.profit)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      In stock
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {selectedProduct.stock} {selectedProduct.unit}
                    </p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const target = selectedProduct;
                    setSelectedProduct(null);
                    goToEdit(target);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setDeleteTarget(selectedProduct)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>{" "}
              and its images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteProduct.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
