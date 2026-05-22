"use client";

import React from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, ArrowUpRight, BarChart3 } from "lucide-react";

export default function DashboardCharts({ salesData, profitData }) {
    // Professional, Adaptive Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl">
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <p className="text-sm text-slate-900 dark:text-zinc-100">
                                <span className="font-medium">{entry.name}:</span>
                                <span className="ml-1 font-semibold">${entry.value.toLocaleString()}</span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-slate-50/50 dark:bg-transparent transition-colors">

            {/* REVENUE ANALYSIS CARD */}
            <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-all overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-zinc-900 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Revenue Analysis</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">Gross income tracking</p>
                    </div>
                    <div className="h-9 w-9 rounded-md bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <TrendingUp size={18} />
                    </div>
                </div>

                <div className="p-6">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-zinc-800" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    name="Revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>

            {/* PROFIT MARGIN CARD */}
            <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-all overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-zinc-900 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Net Profit Yield</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">Post-expenditure summary</p>
                    </div>
                    <div className="h-9 w-9 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <BarChart3 size={18} />
                    </div>
                </div>

                <div className="p-6">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-zinc-800" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} content={<CustomTooltip />} />
                                <Bar
                                    dataKey="profit"
                                    name="Net Profit"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-lg border border-slate-100 dark:border-zinc-800">
                        <p className="text-xs font-medium text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Performance vs Target</p>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            <ArrowUpRight size={14} />
                            <span>12.4%</span>
                        </div>
                    </div>
                </div>
            </Card>

        </div>
    );
}