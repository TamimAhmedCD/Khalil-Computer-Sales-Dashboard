import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectDue } from "@/lib/services/dues.api";
import { toast } from "sonner";

// =========================================================
// useCollectDue Hook
// =========================================================

export const useCollectDue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: collectDue,
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["dueCustomers"] });
      queryClient.invalidateQueries({ queryKey: ["dueDashboard"] });
      // Invalidate all customer detail queries (they include customer phone in key)
      queryClient.invalidateQueries({ queryKey: ["customerDueDetail"] });

      toast.success("Due collection recorded successfully", {
        description: `Receipt: ${data.data.receiptNumber}`,
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to record collection";
      toast.error("Collection Failed", {
        description: message,
      });
    },
  });
};
