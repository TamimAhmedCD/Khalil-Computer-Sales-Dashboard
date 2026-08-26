"use client";

import { Download, Package, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Header({ onAdd, onExport, canExport = true }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your inventory, pricing, and stock levels.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={onExport}
          disabled={!canExport}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>
    </div>
  );
}
