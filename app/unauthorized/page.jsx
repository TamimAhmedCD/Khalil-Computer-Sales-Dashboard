'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Lock, Home } from 'lucide-react'
import { cn } from "@/lib/utils"

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-white selection:text-black">
            {/* Background Decorative Element */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-zinc-900/30 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-zinc-900/30 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Main Card */}
                <div className="bg-zinc-950/50 backdrop-blur-2xl border border-zinc-800/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">

                    {/* Header Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center rotate-3 shadow-2xl">
                                <Lock className="w-10 h-10 text-black" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">
                            Access <br /> <span className="text-zinc-500 not-italic">Denied</span>
                        </h1>

                        <div className="h-px w-12 bg-zinc-800 mx-auto my-6" />

                        <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest leading-relaxed">
                            Terminal error: 403 <br />
                            <span className="opacity-60">Unauthorized clearance level</span>
                        </p>

                        <p className="text-zinc-400 text-xs font-medium px-4">
                            Your account does not have the required permissions to access this terminal node.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-10 space-y-3">
                        <Link href="/dashboard" className="block">
                            <button className="w-full bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                <Home size={16} />
                                Return to Base
                            </button>
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="w-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Go Back
                        </button>
                    </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">
                        Khalil Computer Systems &copy; 2026
                    </p>
                </div>
            </div>
        </div>
    )
}