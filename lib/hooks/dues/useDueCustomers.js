"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDueCustomers } from "@/lib/services/dues.api";

export function useDueCustomers(filters = {}) {
  return useQuery({
    queryKey: ["dueCustomers", filters],
    queryFn: () => getDueCustomers(filters),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    onError: (err) => {
      toast.error(err.message || "Failed to load due customers");
    },
  });
}
