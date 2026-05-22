import { deleteSale } from "@/lib/services/sales.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSale,

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["sales"] });

      const previousSales = queryClient.getQueryData(["sales"]);

      queryClient.setQueryData(["sales"], (old = []) =>
        old.filter((item) => item._id !== id),
      );

      return { previousSales };
    },

    onError: (err, id, context) => {
      queryClient.setQueryData(["sales"], context.previousSales);
      toast.error(err.response?.data?.message || "Failed to delete sale");
    },

    onSuccess: () => {
      toast.success("Sale deleted successfully");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};
