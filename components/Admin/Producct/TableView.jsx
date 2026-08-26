"use client";

import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Package,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_STYLES = {
  "In Stock":
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  "Low Stock":
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  "Out of Stock":
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent",
};

export default function TableView({
  products = [],
  currentPage = 1,
  totalPages = 1,
  setCurrentPage,
  onView,
  onEdit,
  onDelete,
  formatCurrency = (v) => v,
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    {p.brand ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {p.brand}
                      </p>
                    ) : null}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {p.category}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(p.sellingPrice)}
              </TableCell>
              <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(p.profit)}
              </TableCell>
              <TableCell className="text-center font-medium">
                {p.stock}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {p.unit}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={STATUS_STYLES[p.status]}>
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
            of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={currentPage <= 1}
              aria-label="Previous page"
              onClick={() => setCurrentPage?.(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              onClick={() =>
                setCurrentPage?.(Math.min(totalPages, currentPage + 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
