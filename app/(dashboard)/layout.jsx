'use client'


import React, { useState } from 'react'
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar"; // Ensure this path is correct
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export default function Layout({ children }) {
  // Move the state here so Sidebar, Header, and Content all know about it
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarProvider>
      {/* The Provider acts as a "wrapper" that lets all internal 
         components (Sidebar, Header, NavUser) talk to each other.
      */}
      <main className="min-h-screen flex w-full">

        {/* Pass state and setter to Sidebar */}
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <div className="flex flex-col flex-1 w-full">
          {/* Pass state to Header so it can adjust its left position */}
          <Header isCollapsed={isCollapsed} />

          {/* Dynamic margins based on isCollapsed */}
          <div className={cn(
            "mt-16 p-4 md:p-6 lg:p-8 transition-all duration-500 min-h-[calc(100vh-64px)]",
            isCollapsed ? "md:ml-20" : "md:ml-64",
            "ml-0" // Reset for mobile
          )}>
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}