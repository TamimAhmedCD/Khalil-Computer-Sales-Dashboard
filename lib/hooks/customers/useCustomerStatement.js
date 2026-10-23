import { useQuery } from "@tanstack/react-query";
import { getCustomerStatement } from "@/lib/services/customers.api";

export const useCustomerStatement = (phone, startDate, endDate, enabled = true) => {
  return useQuery({
    queryKey: ["customerStatement", phone, startDate, endDate],
    queryFn: () => getCustomerStatement(phone, startDate, endDate),
    enabled: enabled && !!phone,
    staleTime: 30000,
  });
};
