import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExpense } from "@/lib/services/expenses.api";
import { toast } from "sonner";

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExpense,
    onSuccess: (data, variables) => {
      toast.success(data.message || "Expense updated successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", variables.id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update expense");
    },
  });
};
