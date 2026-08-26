"use client";

import { AlertTriangle, CircleDollarSign, Package, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function SummaryCards({
  totalProducts = 0,
  lowStock = 0,
  inventoryValue = 0,
  potentialProfit = 0,
  formatCurrency = (v) => v,
}) {
  const cards = [
    {
      label: "Total products",
      value: totalProducts.toLocaleString("en-BD"),
      hint: "Active items in catalog",
      icon: Package,
      tile: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Low / out of stock",
      value: lowStock.toLocaleString("en-BD"),
      hint: lowStock > 0 ? "Needs restocking soon" : "All levels healthy",
      icon: AlertTriangle,
      tile: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueColor: lowStock > 0 ? "text-amber-600 dark:text-amber-400" : "",
    },
    {
      label: "Inventory value",
      value: formatCurrency(inventoryValue),
      hint: "Stock × selling price",
      icon: CircleDollarSign,
      tile: "bg-violet-500/10",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Potential profit",
      value: formatCurrency(potentialProfit),
      hint: "If all current stock sells",
      icon: TrendingUp,
      tile: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-border/70 shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {c.label}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold tracking-tight ${c.valueColor || ""}`}
                >
                  {c.value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{c.hint}</p>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.tile}`}
              >
                <Icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
