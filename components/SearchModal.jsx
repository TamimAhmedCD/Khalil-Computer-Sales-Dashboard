'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, FileText, LayoutDashboard, ShoppingCart, Package, Users, TrendingUp, Settings, DollarSign, BarChart3, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const navigationLinks = {
  admin: [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'overview', 'home'] },
    { name: 'Sales', path: '/admin/sales', icon: ShoppingCart, keywords: ['sales', 'orders', 'transactions'] },
    { name: 'Add Sale', path: '/admin/sales/add', icon: ShoppingCart, keywords: ['new sale', 'create sale', 'add sale'] },
    { name: 'Products', path: '/admin/products', icon: Package, keywords: ['products', 'inventory', 'items'] },
    { name: 'Add Product', path: '/admin/add-product', icon: Package, keywords: ['new product', 'create product', 'add product'] },
    { name: 'Employees', path: '/admin/employees', icon: Users, keywords: ['employees', 'staff', 'team', 'users'] },
    { name: 'Transactions', path: '/admin/transactions', icon: DollarSign, keywords: ['transactions', 'payments', 'money'] },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3, keywords: ['reports', 'analytics', 'statistics'] },
    { name: 'Expenses', path: '/admin/expenses', icon: TrendingUp, keywords: ['expenses', 'costs', 'spending'] },
    { name: 'Expense Categories', path: '/admin/expenses/categories', icon: TrendingUp, keywords: ['expense categories', 'categories'] },
    { name: 'Invoices', path: '/admin/invoices', icon: FileText, keywords: ['invoices', 'bills', 'receipts'] },
    { name: 'Create Invoice', path: '/admin/invoices/add', icon: FileText, keywords: ['new invoice', 'create invoice', 'add invoice'] },
    { name: 'Categories', path: '/admin/categories', icon: Package, keywords: ['categories', 'product categories'] },
    { name: 'Settings', path: '/settings', icon: Settings, keywords: ['settings', 'preferences', 'configuration'] },
    { name: 'Profile', path: '/profile', icon: Users, keywords: ['profile', 'account', 'user settings'] },
  ],
  employee: [
    { name: 'Employee Dashboard', path: '/employee/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'overview', 'home'] },
    { name: 'Sales', path: '/employee/sales', icon: ShoppingCart, keywords: ['sales', 'orders', 'transactions'] },
    { name: 'Add Sale', path: '/employee/sales/add', icon: ShoppingCart, keywords: ['new sale', 'create sale', 'add sale'] },
    { name: 'Products', path: '/employee/products', icon: Package, keywords: ['products', 'inventory', 'items'] },
    { name: 'Reports', path: '/employee/reports', icon: BarChart3, keywords: ['reports', 'analytics', 'statistics'] },
    { name: 'Invoices', path: '/employee/invoices', icon: FileText, keywords: ['invoices', 'bills', 'receipts'] },
    { name: 'Create Invoice', path: '/employee/invoices/add', icon: FileText, keywords: ['new invoice', 'create invoice', 'add invoice'] },
    { name: 'Profile', path: '/profile', icon: Users, keywords: ['profile', 'account', 'user settings'] },
  ],
}

export function SearchModal({ open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { data: session } = useSession()

  const userRole = session?.user?.role || 'employee'
  const links = navigationLinks[userRole] || navigationLinks.employee

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return links

    const query = searchQuery.toLowerCase().trim()
    return links.filter(link =>
      link.name.toLowerCase().includes(query) ||
      link.path.toLowerCase().includes(query) ||
      link.keywords.some(keyword => keyword.includes(query))
    )
  }, [searchQuery, links])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredLinks.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredLinks.length) % filteredLinks.length)
    } else if (e.key === 'Enter' && filteredLinks[selectedIndex]) {
      e.preventDefault()
      handleNavigate(filteredLinks[selectedIndex].path)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onOpenChange(false)
    }
  }

  const handleNavigate = (path) => {
    router.push(path)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <span>Search Navigation</span>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative border-b border-border">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search pages, features, or actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-12 pr-12 h-16 text-base shadow-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredLinks.length > 0 ? (
            <div className="space-y-1">
              {filteredLinks.map((link, index) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNavigate(link.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      "hover:bg-accent focus:bg-accent focus:outline-none",
                      selectedIndex === index && "bg-accent"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                      selectedIndex === index ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {link.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.path}
                      </p>
                    </div>
                    {selectedIndex === index && (
                      <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-background border px-2 py-1 font-mono text-xs font-medium text-muted-foreground">
                        Enter
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No results found</p>
              <p className="text-xs text-muted-foreground">
                Try searching for something else
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredLinks.length > 0 && (
          <div className="border-t border-border px-4 py-3 bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 rounded bg-background border font-mono">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 rounded bg-background border font-mono">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
