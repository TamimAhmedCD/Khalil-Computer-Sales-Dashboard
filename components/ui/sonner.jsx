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
          <CircleCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
        ),
        info: (
          <InfoIcon className="size-5 text-blue-600 dark:text-blue-400" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 text-amber-600 dark:text-amber-400" />
        ),
        error: (
          <OctagonXIcon className="size-5 text-red-600 dark:text-red-400" />
        ),
        loading: (
          <Loader2Icon className="size-5 text-zinc-600 dark:text-zinc-400 animate-spin" />
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
          success: "!bg-emerald-50 !text-emerald-950 !border-emerald-300 dark:!bg-emerald-950 dark:!text-emerald-50 dark:!border-emerald-700",
          error: "!bg-red-50 !text-red-950 !border-red-300 dark:!bg-red-950 dark:!text-red-50 dark:!border-red-700",
          warning: "!bg-amber-50 !text-amber-950 !border-amber-300 dark:!bg-amber-950 dark:!text-amber-50 dark:!border-amber-700",
          info: "!bg-blue-50 !text-blue-950 !border-blue-300 dark:!bg-blue-950 dark:!text-blue-50 dark:!border-blue-700",
          loading: "!bg-zinc-50 !text-zinc-950 !border-zinc-300 dark:!bg-zinc-900 dark:!text-zinc-50 dark:!border-zinc-700",
        },
      }}
      {...props} />
  );
}

export { Toaster }
