"use client";

import React from "react";
import { Trophy, Award, TrendingUp, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function TopEmployeesTable({ topEmployees }) {
    return (
        <Card className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between bg-slate-50/30 dark:bg-zinc-900/10">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                        Top Performers
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-500">Employee contribution and performance audit</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                    <Trophy size={20} />
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-zinc-900/30 text-xs font-semibold text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-900">
                            <th className="px-6 py-4 text-left">Performance Rank</th>
                            <th className="px-6 py-4 text-left">Total Revenue</th>
                            <th className="px-6 py-4 text-left">Contribution</th>
                            <th className="px-6 py-4 text-right">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                        {topEmployees.map((employee, index) => (
                            <tr
                                key={employee.id}
                                className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                            >
                                {/* Rank & Name */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                            index === 0
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                                        )}>
                                            {index === 0 ? <Award size={14} /> : index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                                {employee.name}
                                            </p>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500">
                                                Senior Associate
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Sales */}
                                <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                                        ${employee.sales.toLocaleString()}
                                    </span>
                                </td>

                                {/* Profit */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp size={14} className="text-emerald-500" />
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            ${employee.profit.toLocaleString()}
                                        </span>
                                    </div>
                                </td>

                                {/* Commission */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                                            ${employee.commission.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                                            Current Period
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/30 border-t border-slate-100 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-zinc-500">
                        Performance data updated as of today
                    </p>
                    <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        View Full Report
                    </button>
                </div>
            </div>
        </Card>
    );
}