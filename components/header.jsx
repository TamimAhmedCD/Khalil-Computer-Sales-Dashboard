'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Sun, Moon, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header({ isCollapsed }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()

  // Prevent Hydration Mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 flex items-center justify-end px-4 md:px-8 z-30 transition-all duration-500 backdrop-blur-3xl",
      // Changed to Solid Black for both modes or high-contrast Dark Zinc
      "border-b",
      isCollapsed ? "md:left-20" : "md:left-64",
      "left-0"
    )}>

      <div className="flex items-center gap-2 md:gap-5">

        {/* Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all group">
          <Bell className="w-5 h-5 text-zinc-500 group-hover:text-black dark:group-white transition-colors" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-black dark:bg-white rounded-full ring-2 ring-white dark:ring-[#020617]" />
        </button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 h-10 w-10"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-zinc-400" /> : <Moon className="w-5 h-5 text-zinc-600" />}
        </Button>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden md:block mx-1" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1 pr-2 md:pr-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-all outline-none group">
              <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-sm shadow-xl transition-transform group-hover:scale-95 group-hover:rotate-3">
                {session?.user?.name?.charAt(0).toUpperCase() || "?"}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-black text-black dark:text-white uppercase tracking-tighter leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.15em] mt-1">
                  {session?.user?.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-60 mt-2 p-2 rounded-2xl bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 shadow-2xl"
          >
            <DropdownMenuLabel className="px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Staff Terminal</p>
              <p className="text-sm font-bold text-black dark:text-white mt-1 truncate">{session?.user?.email}</p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-colors">
              <User className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-tight">Profile Terminal</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-colors">
              <Settings className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold uppercase tracking-tight">System Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

            <DropdownMenuItem
              onClick={() => signOut()}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}