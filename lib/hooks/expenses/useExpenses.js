import { useQuery } from "@tanstack/react-query";
import { getExpenses } from "@/lib/services/expenses.api";

export const useExpenses = (filters = {}) => {
  const { search = "", dateFilter = "all", category = "all", paymentMethod = "all", paidBy = "all", scope = "all", customStartDate, customEndDate, page = 1 } = filters;

  return useQuery({
    queryKey: ["expenses", { search, dateFilter, category, paymentMethod, paidBy, scope, customStartDate, customEndDate, page }],
    queryFn: ({ queryKey }) => {
      const [, queryFilters] = queryKey;
      return getExpenses(queryFilters);
    },
    staleTime: 30000, // 30 seconds
    keepPreviousData: true,
  });
};
