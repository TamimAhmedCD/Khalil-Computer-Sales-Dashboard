import { addProduct } from "@/lib/services/products.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProduct,

    onSuccess: (data) => {
      toast.success(data?.message || "Product added successfully");
    },

    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add product");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
