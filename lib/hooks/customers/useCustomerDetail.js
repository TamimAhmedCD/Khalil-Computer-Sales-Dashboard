import { useQuery } from "@tanstack/react-query";
import { getCustomerDetail } from "@/lib/services/customers.api";

export const useCustomerDetail = (phone, enabled = true) => {
  return useQuery({
    queryKey: ["customerDetail", phone],
    queryFn: () => getCustomerDetail(phone),
    enabled: enabled && !!phone,
    staleTime: 30000,
  });
};
