import { updateProduct } from "@/lib/services/products.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,

    onSuccess: (data) => {
      toast.success(data?.message || "Product updated successfully");
    },

    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update product");
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      }
    },
  });
};
