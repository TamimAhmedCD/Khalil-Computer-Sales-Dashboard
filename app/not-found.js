/* eslint-disable react-hooks/purity */
"use client";

import Link from "next/link";
import { MoveLeft, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-100 dark:bg-zinc-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none overflow-hidden font-mono text-[10px] leading-none break-all p-4">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="mb-1 uppercase">
              Error_404_Node_Not_Found_Unauthorized_Access_Restricted_Area_System_Fault_
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* Terminal Icon / 404 Label */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md mb-4">
          <Terminal size={14} className="text-zinc-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            System Error // 404
          </span>
        </div>

        {/* Big Glitch Text */}
        <div className="space-y-2">
          <h1 className="text-[120px] md:text-[180px] font-black italic leading-none tracking-tighter text-black dark:text-white uppercase select-none">
            Lost<span className="text-zinc-300 dark:text-zinc-800">.</span>
          </h1>
          <p className="text-sm md:text-lg font-bold text-zinc-500 uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
            The requested{" "}
            <span className="text-black dark:text-white italic">Node_ID</span>{" "}
            does not exist or has been decommissioned.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
          <Button
            asChild
            className="h-14 px-8 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            <Link href="/dashboard" className="flex items-center gap-3">
              <MoveLeft size={18} /> Return to Terminal
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-14 px-8 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            <Link href="/support">Report Breach</Link>
          </Button>
        </div>

        {/* Footer Technical Metadata */}
        <div className="pt-20">
          <div className="flex items-center justify-center gap-6 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Connection: Severed
            </div>
            <div>Auth: Verified</div>
            <div>
              Trace_ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
