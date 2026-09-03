import { useQuery } from "@tanstack/react-query";
import { getExpense } from "@/lib/services/expenses.api";

export const useExpense = (id) => {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: () => getExpense(id),
    enabled: !!id,
  });
};
