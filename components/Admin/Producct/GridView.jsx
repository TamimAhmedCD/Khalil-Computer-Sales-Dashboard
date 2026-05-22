'use client';

import React from 'react';
import { Edit2, Trash2, Image as ImageIcon, Box } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function InventoryGrid({ products, setSelectedProduct }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
                <Card
                    key={product.id}
                    className="group relative bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/60 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all duration-500"
                >
                    {/* Asset Preview Node */}
                    <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center overflow-hidden">
                        <div className="absolute top-4 left-4 z-10">
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border shadow-sm",
                                product.status === 'In Stock' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                product.status === 'Low Stock' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                product.status === 'Out of Stock' && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}>
                                {product.status}
                            </div>
                        </div>

                        <ImageIcon className="h-10 w-10 text-zinc-300 dark:text-zinc-700 group-hover:scale-110 transition-transform duration-500" />

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <Button
                                onClick={() => setSelectedProduct(product)}
                                variant="secondary"
                                size="sm"
                                className="rounded-xl font-bold text-[10px] uppercase h-9 bg-white text-black hover:bg-zinc-100"
                            >
                                View Details
                            </Button>
                        </div>
                    </div>

                    {/* Content Specs */}
                    <div className="p-6 space-y-5">
                        <div className="space-y-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 truncate pr-4">
                                    {product.name}
                                </h3>
                                <span className="text-[10px] font-mono text-zinc-400">#{product.id.toString().slice(-4)}</span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                Class: <span className="text-zinc-600 dark:text-zinc-400">{product.category}</span>
                            </p>
                        </div>

                        {/* Financial Data Strip */}
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Market Price</span>
                                <span className="text-xs font-mono font-bold">₹{product.sellingPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-700 pl-3">
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Net Profit</span>
                                <span className="text-xs font-mono font-bold text-emerald-500">₹{product.profit.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Units & Protocol Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <Box size={14} className="text-zinc-400" />
                                <span className="text-xs font-black uppercase tracking-tighter">
                                    {product.stock} <span className="text-zinc-400 font-medium">Units</span>
                                </span>
                            </div>

                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <Edit2 size={14} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-600">
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}