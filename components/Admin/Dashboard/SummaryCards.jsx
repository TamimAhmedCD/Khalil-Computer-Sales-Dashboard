"use client";

import React from 'react';
import {
    Card
} from "@/components/ui/card";
import {
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SummaryGrid({
    todaysSales,
    todaysProfit,
    todaysExpense,
    totalCommission,
    totalEmployees,
    netProfit
}) {

    const stats = [
        {
            label: "Today's Sales",
            value: `₹${todaysSales.toLocaleString()}`,
            icon: ShoppingCart,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500",
            trend: "+12% vs yesterday",
            trendUp: true
        },
        {
            label: "Today's Profit",
            value: `₹${todaysProfit.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-500",
            trend: "+8% vs yesterday",
            trendUp: true
        },
        {
            label: "Today's Expense",
            value: `₹${todaysExpense.toLocaleString()}`,
            icon: TrendingDown,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-500",
            trend: "+5% vs yesterday",
            trendUp: false
        },
        {
            label: "Total Commission",
            value: `₹${totalCommission.toLocaleString()}`,
            icon: DollarSign,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500",
            trend: "+15% this month",
            trendUp: true
        },
        {
            label: "Total Employees",
            value: totalEmployees.toString(),
            icon: Users,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-500",
            trend: "+2 new joined",
            trendUp: true
        },
        {
            label: "Net Profit",
            value: `₹${netProfit.toLocaleString()}`,
            icon: Zap,
            color: "text-teal-600 dark:text-teal-400",
            bg: "bg-teal-500",
            trend: "+22% vs last month",
            trendUp: true
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {stats.map((item, i) => (
                <Card
                    key={i}
                    className={cn(
                        "relative overflow-hidden group p-6 rounded-[2rem] transition-all duration-300",
                        "hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10",
                        "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50"
                    )}
                >
                    {/* Subtle background glow that appears on hover */}
                    <div className={cn(
                        "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                        item.bg
                    )} />

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    {item.label}
                                </p>
                                <h2 className="text-3xl font-black text-foreground tracking-tighter">
                                    {item.value}
                                </h2>
                            </div>

                            {/* Icon Container with Custom Shadow */}
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                "group-hover:rotate-[10deg] group-hover:scale-110",
                                "bg-white dark:bg-zinc-800 shadow-lg border border-border/50",
                                item.color
                            )}>
                                <item.icon className="h-7 w-7" />
                            </div>
                        </div>

                        {/* Trend Indicator Badge */}
                        <div className="mt-6 flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                item.trendUp
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                            )}>
                                {item.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {item.trend}
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}