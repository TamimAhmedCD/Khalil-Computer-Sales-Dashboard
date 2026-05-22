'use client';

import React from 'react';
import { Search, List, Grid3X3, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function FilterSection({
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    stockFilter,
    setStockFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    totalResults,
    startIndex,
    endIndex
}) {
    return (
        <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-xl shadow-sm">

            {/* --- Primary Control Row --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                {/* Search Architecture */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                    </div>
                    <Input
                        placeholder="Query repository by asset name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 h-14 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500 transition-all shadow-sm placeholder:text-[10px] placeholder:uppercase placeholder:tracking-[0.2em] font-medium"
                    />
                </div>

                {/* Tactical Filter Cluster */}
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[170px] h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black font-black text-[10px] uppercase tracking-tighter">
                            <div className="flex items-center gap-2">
                                <Filter size={12} className="text-zinc-400" />
                                <SelectValue placeholder="Category" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-800">
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Clothing">Clothing</SelectItem>
                            <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger className="w-[150px] h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black font-black text-[10px] uppercase tracking-tighter">
                            <SelectValue placeholder="Inventory" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-800">
                            <SelectItem value="all">Total Stock</SelectItem>
                            <SelectItem value="low">Low Inventory</SelectItem>
                            <SelectItem value="out">Depleted</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2 hidden md:block" />

                    {/* Sort Protocol */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[150px] h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black font-black text-[10px] uppercase tracking-tighter">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={12} className="text-zinc-400" />
                                <SelectValue placeholder="Sort By" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-800">
                            <SelectItem value="name">Alpha (A-Z)</SelectItem>
                            <SelectItem value="price">Valuation</SelectItem>
                            <SelectItem value="stock">Quantities</SelectItem>
                            <SelectItem value="profit">Margins</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- Secondary Metadata Row --- */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Showing {startIndex}—{endIndex} <span className="text-zinc-300 dark:text-zinc-700 mx-1">of</span> {totalResults} Assets
                        </p>
                    </div>
                </div>

                {/* View Segment Control */}
                <div className="flex bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode('table')}
                        className={cn(
                            "h-9 w-9 rounded-lg transition-all",
                            viewMode === 'table' ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "h-9 w-9 rounded-lg transition-all",
                            viewMode === 'grid' ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}