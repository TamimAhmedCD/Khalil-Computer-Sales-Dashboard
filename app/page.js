"use client";
import { signIn, useSession } from "next-auth/react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Cpu,
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  AlertCircle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  React.useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const submit = async (data) => {
    try {
      setLoading(true);
      setAuthError("");

      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!res?.ok) {
        setAuthError("Invalid email or password");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setAuthError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black overflow-hidden selection:bg-white selection:text-black">
      {/* --- LEFT SIDE: Visual Branding (Stealth Pro Look) --- */}
      <div className="hidden lg:flex flex-1 relative bg-zinc-950 items-center justify-center p-16 overflow-hidden border-r border-zinc-800/50">
        {/* Subtle White Glows - Replaces Primary Colors */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/[0.02] blur-[100px] rounded-full" />

        <div className="relative z-10 max-w-lg">
          <div className="h-20 w-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)] mb-10 rotate-6">
            <Cpu className="h-10 w-10 text-black" />
          </div>
          <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.9] mb-6">
            KHALIL <br />
            <span className="text-zinc-500">SYSTEMS.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed font-medium max-w-sm">
            High-performance management interface for modern computer retail
            operations.
          </p>

          <div className="mt-12 inline-flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <Shield className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              Hardware-Level Security
            </span>
          </div>
        </div>

        {/* Technical Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* --- RIGHT SIDE: Login Form (Clean Minimalist) --- */}
      <div className="flex-1 lg:flex-[0.8] xl:flex-[0.6] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-white tracking-tight">
              Login
            </h2>
            <p className="text-zinc-500 mt-2 font-medium italic">
              Access the administrative control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            {authError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white text-black text-xs font-black uppercase tracking-tighter animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-4 w-4" />
                {authError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">
                Operator Email
              </label>
              <div className="relative group">
                <Mail
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300",
                    errors.email
                      ? "text-red-500"
                      : "text-zinc-700 group-focus-within:text-white",
                  )}
                />
                <input
                  {...register("email", {
                    required: "Access ID is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Input a valid email structure",
                    },
                  })}
                  type="email"
                  placeholder="operator@khalil.sys"
                  className={cn(
                    "w-full h-14 pl-12 pr-4 bg-zinc-900/40 border rounded-xl text-white outline-none transition-all duration-300",
                    errors.email
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-zinc-800 focus:border-white",
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-[10px] font-bold tracking-tight uppercase mt-1 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300",
                    errors.password
                      ? "text-red-500"
                      : "text-zinc-700 group-focus-within:text-white",
                  )}
                />
                <input
                  {...register("password", {
                    required: "Key sequence required",
                  })}
                  type="password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full h-14 pl-12 pr-4 bg-zinc-900/40 border rounded-xl text-white outline-none transition-all duration-300",
                    errors.password
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-zinc-800 focus:border-white",
                  )}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-[10px] font-bold tracking-tight uppercase mt-1 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button (Pure White/Black Contrast) */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-14 bg-white hover:bg-zinc-200 text-black font-black rounded-xl transition-all active:scale-[0.98] mt-4",
                "flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-xs",
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify & Initialize
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-12 text-zinc-700 text-[10px] font-black uppercase tracking-[0.5em] cursor-default">
            AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
