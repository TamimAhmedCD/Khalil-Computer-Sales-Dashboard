import { Card } from '@/components/ui/card'
import { AlertCircle, DollarSign, Package, TrendingUp } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'

export default function SummaryCards({ totalProducts, lowStockProducts, topSellingProduct, totalInventoryValue }) {
    const stats = [
        {
            label: 'Gross Inventory',
            value: totalProducts,
            icon: Package,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            description: 'Total active units'
        },
        {
            label: 'Critical Stock',
            value: lowStockProducts,
            icon: AlertCircle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            description: 'Action required',
            isCritical: lowStockProducts > 0
        },
        {
            label: 'Top Performance',
            value: topSellingProduct?.name || 'N/A',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            description: 'Highest volume node',
            truncate: true
        },
        {
            label: 'Est. Valuation',
            value: `₹${(totalInventoryValue / 100000).toFixed(1)}L`,
            icon: DollarSign,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            description: 'Market asset value'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className="relative overflow-hidden group border-none bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] p-6"
                >
                    {/* Background Decorative Glow */}
                    <div className={cn(
                        "absolute top-0 right-0 w-24 h-24 blur-[45px] rounded-full opacity-20 -mr-8 -mt-8 transition-opacity group-hover:opacity-40",
                        stat.bg
                    )} />

                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-4">
                            {/* Terminal-style Label */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
                                    {stat.label}
                                </p>
                                <h3 className={cn(
                                    "text-3xl font-black tracking-tighter uppercase leading-none",
                                    stat.truncate && "max-w-[140px] truncate"
                                )}>
                                    {stat.value}
                                </h3>
                            </div>

                            {/* Descriptive Meta-text */}
                            <p className={cn(
                                "text-[9px] font-bold uppercase italic tracking-wider",
                                stat.isCritical ? "text-rose-500 animate-pulse" : "text-zinc-500"
                            )}>
                                {stat.description}
                            </p>
                        </div>

                        {/* Icon Housing */}
                        <div className={cn(
                            "p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                            stat.bg
                        )}>
                            <stat.icon className={cn("h-5 w-5 stroke-[2.5px]", stat.color)} />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}