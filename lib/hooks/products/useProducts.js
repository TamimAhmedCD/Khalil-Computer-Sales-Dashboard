import { getProducts } from "@/lib/services/products.api";
import { useQuery } from "@tanstack/react-query";

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
