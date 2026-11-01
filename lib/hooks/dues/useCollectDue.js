"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { collectDue } from "@/lib/services/dues.api";

export function useCollectDue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectDue,
    onSuccess: (data) => {
      toast.success(`Due collected! Receipt: ${data.data?.receiptNumber || ""}`);
      queryClient.invalidateQueries({ queryKey: ["dueCustomers"] });
      queryClient.invalidateQueries({ queryKey: ["dueDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dueHistory"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to collect due");
    },
  });
}
