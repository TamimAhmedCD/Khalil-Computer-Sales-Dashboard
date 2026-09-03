import { useQuery } from "@tanstack/react-query";
import { getExpenseCategories } from "@/lib/services/expenses.api";

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ["expenseCategories"],
    queryFn: getExpenseCategories,
    staleTime: 60000, // 1 minute
  });
};
