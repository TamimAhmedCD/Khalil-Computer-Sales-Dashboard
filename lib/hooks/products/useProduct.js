import { getProduct } from "@/lib/services/products.api";
import { useQuery } from "@tanstack/react-query";

export const useProduct = (id) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
