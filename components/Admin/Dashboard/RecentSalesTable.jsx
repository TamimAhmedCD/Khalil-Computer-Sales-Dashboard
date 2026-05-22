"use client";

import React from "react";
import { Clock, ArrowRight, ChevronLeft, ChevronRight, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RecentSalesTable({ paginatedSales, currentPage, setCurrentPage, totalPages, itemsPerPage, recentSales }) {
    return (
        <Card className="bg-white dark:bg-zinc-950 rounded-xl border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-8">
            {/* Header Section */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                        Transaction History
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-500">A real-time overview of recent operational sales</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <History size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Live Updates Enabled</span>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-xs font-semibold text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-900">
                            <th className="px-6 py-4 text-left">Date & Time</th>
                            <th className="px-6 py-4 text-left">Operator</th>
                            <th className="px-6 py-4 text-left">Inventory Item</th>
                            <th className="px-6 py-4 text-center">Amount</th>
                            <th className="px-6 py-4 text-right">Net Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                        {paginatedSales.map((sale) => (
                            <tr
                                key={sale.id}
                                className="group hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors cursor-default"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <Clock size={14} className="text-slate-400" />
                                        <span className="text-sm text-slate-600 dark:text-zinc-300">
                                            {sale.time}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                            {sale.employee.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                                            {sale.employee}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                                            {sale.product}
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-zinc-500">
                                            {sale.category}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                        ${sale.amount.toLocaleString()}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        +${sale.profit.toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500 dark:text-zinc-500">
                    Showing <span className="font-semibold text-slate-900 dark:text-zinc-100">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900 dark:text-zinc-100">{Math.min(currentPage * itemsPerPage, recentSales.length)}</span> of {recentSales.length} records
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="rounded-md border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                    >
                        <ChevronLeft size={16} className="mr-1" />
                        Back
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-md border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                    >
                        Next
                        <ChevronRight size={16} className="ml-1" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}