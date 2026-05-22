import { Button } from '@/components/ui/button'
import { Download, Plus, Trash2 } from 'lucide-react'
import React from 'react'

export default function Header({ setShowModal, selectedProducts, handleBulkDelete, handleExport }) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
            <div className="space-y-1">
                {/* Subtle Breadcrumb/Label */}
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-1">
                    Inventory // Protocol
                </p>

                {/* Primary Heading with Italic Contrast */}
                <h1 className="text-4xl font-black italic tracking-tighter text-black dark:text-white uppercase">
                    Product <span className="text-zinc-400 not-italic font-light">Repository</span>
                </h1>

                {/* Meta Description */}
                <p className="text-[11px] font-medium text-zinc-500 max-w-md uppercase tracking-wider">
                    Centralized management system for stock levels and asset distribution.
                </p>
            </div>

            {/* Action Cluster */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Secondary Action: Outline Style */}
                <Button
                    onClick={handleExport}
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold uppercase text-[10px] tracking-widest transition-all group"
                >
                    <Download className="mr-2 h-4 w-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    Export Data
                </Button>

                {/* Conditional Bulk Action: Destructive Alert */}
                {selectedProducts.length > 0 && (
                    <Button
                        onClick={handleBulkDelete}
                        variant="destructive"
                        className="h-12 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20 animate-in fade-in zoom-in-95"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Purge ({selectedProducts.length})
                    </Button>
                )}

                {/* Primary Action: Solid High-Contrast */}
                <Button
                    onClick={() => setShowModal(true)}
                    className="h-12 px-8 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4 stroke-[3px]" />
                    Add New Asset
                </Button>
            </div>
        </div>
    )
}
