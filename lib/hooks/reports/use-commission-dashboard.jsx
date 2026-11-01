"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCommissionDashboard({ dateFilter = "today", recipient = "all", customStartDate, customEndDate } = {}) {
  const queryKey = ["commissionDashboard", dateFilter, recipient, customStartDate, customEndDate];

  const queryFn = async () => {
    const params = new URLSearchParams();
    params.append("dateFilter", dateFilter);
    if (recipient && recipient !== "all") params.append("recipient", recipient);
    if (customStartDate) params.append("customStartDate", customStartDate);
    if (customEndDate) params.append("customEndDate", customEndDate);

    const response = await fetch(`/api/reports/commission?${params.toString()}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `Failed to fetch commission data (${response.status})`);
    }

    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to load commission data");
    return result.data;
  };

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    onError: (err) => {
      toast.error(err.message || "Failed to load commission report");
    },
  });
}
