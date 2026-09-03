import { useQuery } from "@tanstack/react-query";
import { getEmployeeProducts } from "@/lib/services/employee-products.api";

export const useEmployeeProducts = (filters = {}) => {
  const { search = "", category = "", page = 1 } = filters;

  return useQuery({
    queryKey: ["employee-products", { search, category, page }],
    queryFn: ({ queryKey }) => {
      const [, queryFilters] = queryKey;
      return getEmployeeProducts(queryFilters);
    },
    staleTime: 60000, // 1 minute
    keepPreviousData: true,
  });
};