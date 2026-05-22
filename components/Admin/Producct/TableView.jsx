/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import React from 'react';
import { Eye, Edit2, Trash2, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TableView({
    products,
    currentPage,
    totalPages,
    setCurrentPage,
    setSelectedProduct
}) {
    return (
        <Card className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800/60 overflow-hidden backdrop-blur-md mt-7">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Asset Identity</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Class</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Valuation</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Margin</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Units</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Node Status</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {products.map((product) => (
                            <tr key={product.id} className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-all duration-200">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{product.name}</span>
                                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">ID-{product.id.toString().slice(-6)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[11px] font-bold uppercase text-zinc-500">{product.category}</span>
                                </td>
                                <td className="px-6 py-5 font-mono text-xs">₹{product.sellingPrice.toLocaleString()}</td>
                                <td className="px-6 py-5 font-bold text-xs text-emerald-500">
                                    <div className="flex items-center gap-1">
                                        <span>+</span>
                                        <span>₹{product.profit.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-black text-xs">
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                        product.status === 'In Stock' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                        product.status === 'Low Stock' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                        product.status === 'Out of Stock' && "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    )}>
                                        <div className={cn(
                                            "w-1 h-1 rounded-full",
                                            product.status === 'In Stock' && "bg-emerald-500",
                                            product.status === 'Low Stock' && "bg-amber-500",
                                            product.status === 'Out of Stock' && "bg-rose-500"
                                        )} />
                                        {product.status}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-zinc-700 shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-600"
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-zinc-700 shadow-sm border border-transparent hover:border-zinc-200">
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-rose-500/10 hover:text-rose-600">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products.length === 0 && (
                    <div className="text-center py-20">
                        <Package className="h-12 w-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-4 stroke-[1px]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Zero Records Found</h3>
                    </div>
                )}
            </div>

            {/* --- Tactical Pagination --- */}
            {totalPages > 1 && (
                <div className="px-8 py-5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Sector {currentPage} <span className="text-zinc-200 dark:text-zinc-800">//</span> Total {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-8 text-[10px] font-black uppercase border-zinc-200 dark:border-zinc-800"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            Back
                        </Button>
                        {/* Minimalist page indicators could go here */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-8 text-[10px] font-black uppercase border-zinc-200 dark:border-zinc-800"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Forward
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}