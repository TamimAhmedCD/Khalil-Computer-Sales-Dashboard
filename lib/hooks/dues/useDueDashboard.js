import { useQuery } from "@tanstack/react-query";
import { getDueDashboard } from "@/lib/services/dues.api";

// =========================================================
// useDueDashboard Hook
// =========================================================

export const useDueDashboard = () => {
  return useQuery({
    queryKey: ["dueDashboard"],
    queryFn: getDueDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
