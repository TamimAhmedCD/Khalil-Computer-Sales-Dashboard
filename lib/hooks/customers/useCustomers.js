import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/services/customers.api";

export const useCustomers = (filters = {}) => {
  const { search = "", status = "all", page = 1, limit = 10 } = filters;

  return useQuery({
    queryKey: ["customers", { search, status, page, limit }],
    queryFn: ({ queryKey }) => getCustomers(queryKey[1]),
    staleTime: 30000,
    keepPreviousData: true,
  });
};
