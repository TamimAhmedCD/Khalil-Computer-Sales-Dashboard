"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePnLReport({ dateFilter, scope }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const queryKey = ["profitLoss", dateFilter, scope];

  const queryFn = async () => {
    const params = new URLSearchParams();
    params.append("dateFilter", dateFilter || "today");
    if (scope && scope !== "all") params.append("expenseScope", scope);

    const response = await fetch(
      `/api/reports/profit-loss?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch profit/loss report (${response.status})`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch profit/loss report");
    }

    return result;
  };

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    onError: (error) => {
      toast.error(error.message || "Failed to load report");
    },
  });
}
