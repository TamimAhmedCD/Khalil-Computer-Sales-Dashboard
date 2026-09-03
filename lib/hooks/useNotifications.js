import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllReadNotifications,
  createNotification,
} from "@/lib/services/notifications.api";

// Main notifications hook
export function useNotifications(options = {}) {
  const queryClient = useQueryClient();

  const {
    limit = 20,
    unreadOnly = false,
    refetchInterval = 30000, // Poll every 30 seconds
    ...queryOptions
  } = options;

  const notificationsQuery = useQuery({
    queryKey: ["notifications", { limit, unreadOnly }],
    queryFn: () => getNotifications({ limit, unreadOnly }),
    refetchInterval,
    ...queryOptions,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to mark notification as read");
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to mark notifications as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete notification");
    },
  });

  const clearAllReadMutation = useMutation({
    mutationFn: clearAllReadNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All read notifications cleared");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to clear notifications");
    },
  });

  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Failed to create notification:", error);
    },
  });

  const notifications = notificationsQuery.data?.data || [];
  const unreadCount = notificationsQuery.data?.unreadCount || 0;

  return {
    // Data
    notifications,
    unreadCount,

    // Query state
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,

    // Mutations
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    clearAllRead: clearAllReadMutation.mutate,
    createNotification: createMutation.mutate,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isClearingAll: clearAllReadMutation.isPending,
    isCreating: createMutation.isPending,
  };
}
