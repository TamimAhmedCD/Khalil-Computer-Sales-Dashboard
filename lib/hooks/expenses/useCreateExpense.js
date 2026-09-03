import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense } from "@/lib/services/expenses.api";
import { toast } from "sonner";

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: (data) => {
      toast.success(data.message || "Expense recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create expense");
    },
  });
};
