import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExpense } from "@/lib/services/expenses.api";
import { toast } from "sonner";

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: (data) => {
      toast.success(data.message || "Expense deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete expense");
    },
  });
};
