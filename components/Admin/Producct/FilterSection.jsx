"use client";

import { Grid3x3, List, Search, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { UnifiedSelect } from "@/components/ui/UnifiedSelect";

export default function FilterSection({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  categories = [],
  totalResults = 0,
  hasActiveFilters = false,
  onClearFilters,
}) {
  return (
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
              onClick={onClearFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or brand…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <CategorySelect
                value={categoryFilter}
                onChange={setCategoryFilter}
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

          <div className="flex items-center gap-1 self-start rounded-lg border p-1 lg:self-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
              className={cn(
                "h-8 w-8",
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 w-8",
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{totalResults}</span>{" "}
          product{totalResults !== 1 ? "s" : ""} found
        </p>
      </CardContent>
    </Card>
  );
}
