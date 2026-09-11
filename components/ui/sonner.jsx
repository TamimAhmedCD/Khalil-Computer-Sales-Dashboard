"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      position="top-center"
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)"
        }
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-950 group-[.toaster]:border-emerald-200 dark:group-[.toaster]:bg-emerald-950/80 dark:group-[.toaster]:text-emerald-100 dark:group-[.toaster]:border-emerald-800/60",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-950 group-[.toaster]:border-red-200 dark:group-[.toaster]:bg-red-950/80 dark:group-[.toaster]:text-red-100 dark:group-[.toaster]:border-red-800/60",
          warning: "group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-950 group-[.toaster]:border-amber-200 dark:group-[.toaster]:bg-amber-950/80 dark:group-[.toaster]:text-amber-100 dark:group-[.toaster]:border-amber-800/60",
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-950 group-[.toaster]:border-blue-200 dark:group-[.toaster]:bg-blue-950/80 dark:group-[.toaster]:text-blue-100 dark:group-[.toaster]:border-blue-800/60",
          loading: "group-[.toaster]:bg-zinc-50 group-[.toaster]:text-zinc-950 group-[.toaster]:border-zinc-200 dark:group-[.toaster]:bg-zinc-950/80 dark:group-[.toaster]:text-zinc-100 dark:group-[.toaster]:border-zinc-800/60",
        },
      }}
      {...props} />
  );
}

export { Toaster }
