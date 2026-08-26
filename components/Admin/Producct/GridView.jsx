"use client";

import { Edit2, Eye, Package, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_STYLES = {
  "In Stock":
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  "Low Stock":
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  "Out of Stock":
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent",
};

export default function InventoryGrid({
  products = [],
  onView,
  onEdit,
  onDelete,
  formatCurrency = (v) => v,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => (
        <Card
          key={p.id}
          className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="relative aspect-video overflow-hidden bg-muted">
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
            <Badge
              variant="outline"
              className={`absolute left-3 top-3 ${STATUS_STYLES[p.status]}`}
            >
              {p.status}
            </Badge>
          </div>

          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="truncate font-semibold">{p.name}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {p.category}
                {p.brand ? ` · ${p.brand}` : ""}
              </p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="text-lg font-bold">
                  {formatCurrency(p.sellingPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Profit / unit</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(p.profit)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                {p.stock} {p.unit} in stock
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`View ${p.name}`}
                  onClick={() => onView?.(p)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => onEdit?.(p)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => onDelete?.(p)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
