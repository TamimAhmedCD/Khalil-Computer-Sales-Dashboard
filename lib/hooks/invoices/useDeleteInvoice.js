import { useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/services/invoices.api";
import { toast } from "sonner";

// =========================================================
// Hook to delete an invoice
// =========================================================

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return {
    deleteInvoice: async (id) => {
      try {
        const response = await invoicesApi.delete(id);
        if (response.success) {
          toast.success(response.message || "Invoice deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          return { success: true };
        }
        return { success: false, message: response.message };
      } catch (error) {
        console.error("Delete Invoice Error:", error);
        toast.error(error.message || "Failed to delete invoice");
        return { success: false, message: error.message };
      }
    },
    isLoading: false, // You can implement loading state if needed
  };
}
