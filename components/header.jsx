'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sun, Moon, LogOut, User, Settings, ChevronDown, ShoppingCart, LayoutDashboard, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchModal } from "@/components/SearchModal"

export function Header({ isCollapsed }) {
  const pathname = usePathname()
  const isEmployeeDashboard = pathname?.startsWith('/employee/dashboard')
  const isAdminDashboard = pathname?.startsWith('/admin/dashboard')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: session } = useSession()

  // Prevent Hydration Mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!mounted) return null

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 flex items-center justify-between px-4 md:px-8 z-30 transition-all duration-300",
      "border-b border-border/50 bg-background/80 backdrop-blur-lg backdrop-saturate-150",
      isCollapsed ? "md:left-20" : "md:left-64",
      "left-0"
    )}>

      {/* Left Section - Breadcrumb / Context */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {(isEmployeeDashboard || isAdminDashboard) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
            <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-tight">
              {isEmployeeDashboard ? "Employee Dashboard" : "Admin Dashboard"}
            </span>
          </div>
        )}
      </div>

      {/* Global Search Bar - Click to Open Modal */}
      <div className="hidden md:flex flex-1 max-w-md px-6">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full relative group flex items-center"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search... (Ctrl+K)"
            className="w-full bg-accent/40 hover:bg-accent/80 border-transparent focus-visible:bg-background focus-visible:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/20 pl-9 h-10 rounded-xl transition-all shadow-none cursor-pointer"
            readOnly
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="hidden lg:inline-flex items-center gap-1 rounded bg-background border px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto shrink-0">

        {/* Mobile Search Input Trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="md:hidden rounded-xl hover:bg-accent h-10 w-10 transition-colors"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full border border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Live
          </span>
        </div>

        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 h-9 px-3 rounded-lg hover:bg-accent"
            asChild
          >
            <a href={isEmployeeDashboard ? "/employee/sales/add" : "/admin/sales/add"}>
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Add Sale</span>
            </a>
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl hover:bg-accent h-10 w-10 transition-colors"
        >
          {theme === "dark" ?
            <Sun className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" /> :
            <Moon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          }
        </Button>

        <div className="w-px h-6 bg-border/60 hidden md:block" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1.5 pr-3 hover:bg-accent rounded-xl transition-all duration-200 outline-none group">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition-transform group-hover:scale-95 group-hover:rotate-3">
                  {session?.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background"></div>
              </div>

              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-foreground tracking-tight leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground font-medium capitalize mt-0.5">
                  {session?.user?.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 mt-1 p-2 rounded-xl bg-card border-border shadow-lg"
          >
            <DropdownMenuLabel className="px-3 py-3">
              <p className="text-xs font-semibold text-foreground">Account</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{session?.user?.email}</p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-border my-1" />

            <DropdownMenuItem asChild className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer focus:bg-accent transition-colors">
              <Link href="/profile">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Profile Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer focus:bg-accent transition-colors">
              <Link href="/profile">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">System Preferences</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border my-1" />

            <DropdownMenuItem
              onClick={() => signOut()}
              className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}