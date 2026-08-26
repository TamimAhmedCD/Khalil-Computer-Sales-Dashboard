import { deleteProduct } from "@/lib/services/products.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,

    // Optimistically drop the row from the cached list
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const previousProducts = queryClient.getQueryData(["products"]);
      queryClient.setQueryData(["products"], (old = []) =>
        old.filter((item) => item._id !== id),
      );
      return { previousProducts };
    },

    onError: (err, id, context) => {
      queryClient.setQueryData(["products"], context?.previousProducts);
      toast.error(err.response?.data?.message || "Failed to delete product");
    },

    onSuccess: (data) => {
      toast.success(data?.message || "Product deleted successfully");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
