"use client";
import { Hammer, HardHat, Construction, ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent } from "./card";
import { Progress } from "./progress";
import { Button } from "./button";

export default function PageConstruction() {
  // আপনি চাইলে এখানে ব্যাকএন্ড বা রাউটার লিংক দিয়ে হ্যান্ডেল করতে পারেন
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground relative overflow-hidden">
      {/* Subtle Technical Grid Background Overlay (Matches your stealth look) */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Soft Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 bg-muted-foreground/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        {/* --- ICON ANIMATION CONTAINER --- */}
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-muted/40 border border-border/60 rounded-2xl flex items-center justify-center shadow-sm relative group">
            <Construction className="h-10 w-10 text-foreground animate-pulse" />
            {/* Tiny absolute badge */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
        </div>

        {/* --- TEXT CONTENT --- */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl uppercase">
            Under Construction
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
            We are currently crafting a high-performance interface for this
            section. It will be live very soon.
          </p>
        </div>

        {/* --- PROGRESS BAR CARD --- */}
        <Card className="bg-muted/20 border-border/50 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 space-y-3 text-left">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" /> Modules Deployment
              </span>
              <span className="font-bold text-foreground">75% Complete</span>
            </div>

            {/* Shadcn Progress Component */}
            <Progress
              value={75}
              className="h-2 bg-muted border border-border/30"
            />

            <p className="text-[11px] text-muted-foreground/80 italic text-center pt-1">
              Optimizing responsiveness and data pipelines...
            </p>
          </CardContent>
        </Card>

        {/* --- ACTIONS / NAVIGATION --- */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full h-11 rounded-xl gap-2 font-medium active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>

          <Button
            className="w-full h-11 rounded-xl gap-2 font-medium active:scale-[0.98] transition-all"
            onClick={() =>
              alert("You will be notified once updates are pushed.")
            }
          >
            <Mail className="w-4 h-4" /> Notify Me
          </Button>
        </div>

        {/* --- FOOTER BADGE --- */}
        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] cursor-default pt-6">
          System Update v2.4.0
        </p>
      </div>
    </div>
  );
}
