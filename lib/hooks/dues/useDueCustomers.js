import { useQuery } from "@tanstack/react-query";
import { getDueCustomers } from "@/lib/services/dues.api";

// =========================================================
// useDueCustomers Hook
// =========================================================

export const useDueCustomers = (filters = {}) => {
  return useQuery({
    queryKey: ["dueCustomers", filters],
    queryFn: () => getDueCustomers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};
