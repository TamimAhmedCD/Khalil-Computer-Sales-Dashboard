"use client";

import React from "react";
import { CreditCard, Receipt, Wallet, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ExpenseOverview() {
    const expenseStats = [
        {
            category: "Daily Expenses",
            title: "Today's Outflow",
            amount: "2,500",
            icon: <Receipt size={18} />,
            trend: "+12% vs yesterday",
            trendType: "up", // up | down | neutral
            color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
        },
        {
            category: "Monthly Cycle",
            title: "Total Expenditure",
            amount: "45,000",
            icon: <Wallet size={18} />,
            trend: "Within Budget",
            trendType: "neutral",
            color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
        },
        {
            category: "Peak Tracking",
            title: "Highest Spike",
            amount: "8,500",
            icon: <CreditCard size={18} />,
            trend: "Hardware Acquisition",
            trendType: "neutral",
            color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {expenseStats.map((stat, i) => (
                <Card
                    key={i}
                    className="relative bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden p-6 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                                {stat.category}
                            </p>
                            <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                                {stat.title}
                            </h3>
                        </div>

                        <div className={`p-2.5 rounded-lg border border-transparent ${stat.color}`}>
                            {stat.icon}
                        </div>
                    </div>

                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-slate-400">₹</span>
                        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                            {stat.amount}
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-zinc-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {stat.trendType === "up" && <TrendingUp size={14} className="text-rose-500" />}
                            {stat.trendType === "down" && <TrendingDown size={14} className="text-emerald-500" />}
                            {stat.trendType === "neutral" && <Minus size={14} className="text-slate-400" />}

                            <span className={`text-xs font-medium ${stat.trendType === "up" ? "text-rose-600 dark:text-rose-400" :
                                    stat.trendType === "down" ? "text-emerald-600 dark:text-emerald-400" :
                                        "text-slate-500 dark:text-zinc-500"
                                }`}>
                                {stat.trend}
                            </span>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}