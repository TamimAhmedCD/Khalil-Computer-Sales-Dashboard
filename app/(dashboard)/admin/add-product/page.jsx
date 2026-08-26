"use client";

import { useRouter } from "next/navigation";

import ProductForm from "@/components/Admin/Producct/ProductForm";
import { useAddProduct } from "@/lib/hooks/products/useAddProduct";

export default function AddProductPage() {
  const router = useRouter();
  const addProduct = useAddProduct();

  return (
    <ProductForm
      mode="create"
      submitting={addProduct.isPending}
      onSubmit={(formData, { reset, addAnother }) => {
        addProduct.mutate(formData, {
          onSuccess: () => {
            reset();
            if (!addAnother) router.push("/admin/products");
          },
        });
      }}
    />
  );
}
