"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDueDashboard } from "@/lib/services/dues.api";

export function useDueDashboard() {
  return useQuery({
    queryKey: ["dueDashboard"],
    queryFn: getDueDashboard,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    onError: (err) => {
      toast.error(err.message || "Failed to load due dashboard");
    },
  });
}
