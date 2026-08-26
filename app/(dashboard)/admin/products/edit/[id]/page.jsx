"use client";

import { useParams, useRouter } from "next/navigation";
import { PackageX } from "lucide-react";

import ProductForm from "@/components/Admin/Producct/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/lib/hooks/products/useProduct";
import { useUpdateProduct } from "@/lib/hooks/products/useUpdateProduct";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const { data: product, isLoading, isError } = useProduct(id);
  const updateProduct = useUpdateProduct();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PackageX className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Product not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This product may have been deleted or the link is incorrect.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/products")}>
            Back to products
          </Button>
        </CardContent>
      </Card>
    );
  }

  const initialValues = {
    name: product.name || "",
    categoryId: product.categoryId || "",
    brand: product.brand || "",
    description: product.description || "",
    buyRate: Number(product.buyRate) || 0,
    saleRate: Number(product.saleRate) || 0,
    stock: Number(product.stock) || 0,
    lowStockAlert: Number(product.lowStockAlert) || 0,
    unit: product.unit || "pcs",
    isActive: product.isActive ?? true,
    isFeatured: product.isFeatured ?? false,
  };

  return (
    <ProductForm
      mode="edit"
      initialValues={initialValues}
      initialImages={Array.isArray(product.images) ? product.images : []}
      submitting={updateProduct.isPending}
      onSubmit={(formData) => {
        updateProduct.mutate(
          { id, formData },
          { onSuccess: () => router.push("/admin/products") },
        );
      }}
    />
  );
}
