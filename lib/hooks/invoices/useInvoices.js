import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/services/invoices.api";
import { toast } from "sonner";

// =========================================================
// React Query Hooks for Invoices
// =========================================================

// Hook to fetch all invoices with filtering
export function useInvoices(params = {}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.getAll(params),
    keepPreviousData: true,
  });
}

// Hook to fetch a single invoice by ID
export function useInvoice(id) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  });
}

// Hook to create a new invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => invoicesApi.create(data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Invoice created successfully");
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } else {
        toast.error(data.message || "Failed to create invoice");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });
}

// Hook to update an invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => invoicesApi.update(id, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Invoice updated successfully");
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["invoice"] });
      } else {
        toast.error(data.message || "Failed to update invoice");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice");
    },
  });
}

// Hook to delete an invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => invoicesApi.delete(id),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Invoice deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } else {
        toast.error(data.message || "Failed to delete invoice");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });
}
