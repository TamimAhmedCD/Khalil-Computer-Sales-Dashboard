import { useQuery } from "@tanstack/react-query";
import { getCustomerDashboard } from "@/lib/services/customers.api";

export const useCustomerDashboard = () => {
  return useQuery({
    queryKey: ["customerDashboard"],
    queryFn: getCustomerDashboard,
    staleTime: 30000, // 30 seconds
  });
};
