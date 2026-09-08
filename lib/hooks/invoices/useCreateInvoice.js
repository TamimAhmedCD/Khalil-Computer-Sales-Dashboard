import { useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/services/invoices.api";
import { toast } from "sonner";

// =========================================================
// Hook to create a new invoice
// =========================================================

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return {
    createInvoice: async (data) => {
      try {
        const response = await invoicesApi.create(data);
        if (response.success) {
          toast.success(response.message || "Invoice created successfully");
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          return { success: true, data: response };
        }
        return { success: false, message: response.message };
      } catch (error) {
        console.error("Create Invoice Error:", error);
        toast.error(error.message || "Failed to create invoice");
        return { success: false, message: error.message };
      }
    },
    isLoading: false, // You can implement loading state if needed
  };
}
