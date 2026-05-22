"use client";

import React from "react";
import { AlertCircle, ShieldAlert, Zap, ArrowRight, Wallet, TrendingDown, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotificationSection() {
    const alerts = [
        {
            id: "pending_commission",
            category: "Payroll Ledger",
            title: "Pending Commission",
            desc: "3 operators awaiting payout for the current cycle",
            action: "Review Ledger",
            icon: <Wallet size={18} />,
            badge: "Awaiting Action",
            variant: "amber",
        },
        {
            id: "unpaid_salaries",
            category: "Priority Payroll",
            title: "Unpaid Salaries",
            desc: "5 high-priority payments are past the scheduled date",
            action: "Process Payments",
            icon: <ShieldAlert size={18} />,
            badge: "Urgent",
            variant: "rose",
        },
        {
            id: "low_sales",
            category: "Performance Analytics",
            title: "Efficiency Alert",
            desc: "Weekly sales targets are currently 15% below projection",
            action: "View Analytics",
            icon: <TrendingDown size={18} />,
            badge: "Attention",
            variant: "orange",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
                <Card
                    key={alert.id}
                    className="group relative bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden p-5 transition-all hover:shadow-md"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center border",
                            alert.variant === "amber" && "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                            alert.variant === "rose" && "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
                            alert.variant === "orange" && "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
                        )}>
                            {alert.icon}
                        </div>

                        <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-1 rounded-md border",
                            alert.variant === "amber" && "text-amber-700 bg-amber-50/50 border-amber-200 dark:text-amber-400 dark:bg-transparent",
                            alert.variant === "rose" && "text-rose-700 bg-rose-50/50 border-rose-200 dark:text-rose-400 dark:bg-transparent",
                            alert.variant === "orange" && "text-orange-700 bg-orange-50/50 border-orange-200 dark:text-orange-400 dark:bg-transparent",
                        )}>
                            {alert.badge}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                            {alert.category}
                        </p>
                        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                            {alert.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                            {alert.desc}
                        </p>
                    </div>

                    <div className="mt-6">
                        <Button
                            className="w-full justify-between bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-black rounded-lg h-10 px-4 transition-all"
                        >
                            <span className="text-xs font-bold uppercase tracking-tight">{alert.action}</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}