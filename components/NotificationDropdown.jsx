"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertCircle,
  ShoppingCart,
  Wallet,
  UserPlus,
  Settings,
} from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Notification icon mapping
const NOTIFICATION_ICONS = {
  sale: ShoppingCart,
  expense: Wallet,
  employee: UserPlus,
  system: Settings,
  alert: AlertCircle,
  default: Bell,
};

// Notification color mapping
const NOTIFICATION_COLORS = {
  sale: "bg-blue-500",
  expense: "bg-green-500",
  employee: "bg-purple-500",
  system: "bg-amber-500",
  alert: "bg-red-500",
  default: "bg-zinc-500",
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
  } = useNotifications({ unreadOnly: false, limit: 10 });

  // Get icon component for notification type
  const getNotificationIcon = (type) => {
    const Icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
    const colorClass = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default;
    return { Icon, colorClass };
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setOpen(false);
  };

  // Separate read and unread notifications
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="relative">
        <button className="relative p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all group">
          <Bell className="w-5 h-5 text-zinc-500 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all group">
          <Bell className="w-5 h-5 text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-black dark:bg-white rounded-full ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full ring-2 ring-white dark:ring-zinc-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-black dark:text-white">
              Notifications ({unreadCount > 0 ? `${unreadCount} new` : "All caught up"})
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-[11px] font-bold h-7 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No notifications yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <>
              {/* Unread notifications */}
              {unreadNotifications.length > 0 && (
                <>
                  {unreadNotifications.map((notification) => {
                    const { Icon, colorClass } = getNotificationIcon(notification.type);
                    return (
                      <DropdownMenuItem
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "p-4 border-b border-zinc-100 dark:border-zinc-800 rounded-none focus:bg-zinc-50 dark:focus:bg-zinc-900/50 cursor-pointer group/notification",
                          !notification.isRead && "bg-blue-50/30 dark:bg-blue-950/20"
                        )}
                      >
                        <div className="flex items-start gap-3 w-full">
                          {/* Icon with colored background */}
                          <div className="relative">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorClass)}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full ring-1 ring-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-black dark:text-white leading-tight">
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-zinc-500 whitespace-nowrap">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                              </div>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            {notification.link && (
                              <div className="flex items-center gap-1 mt-2">
                                <ExternalLink className="w-3 h-3 text-zinc-400" />
                                <span className="text-[10px] font-bold text-zinc-500">
                                  Click to view details
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                </>
              )}

              {/* Read notifications */}
              {readNotifications.length > 0 && (
                <>
                  {readNotifications.map((notification) => {
                    const { Icon, colorClass } = getNotificationIcon(notification.type);
                    return (
                      <DropdownMenuItem
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "p-4 border-b border-zinc-100 dark:border-zinc-800 rounded-none focus:bg-zinc-50 dark:focus:bg-zinc-900/50 cursor-pointer group/notification"
                        )}
                      >
                        <div className="flex items-start gap-3 w-full">
                          {/* Icon with muted background */}
                          <div className="relative">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorClass, "opacity-70")}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <Check className="absolute -top-0.5 -right-0.5 w-3 h-3 text-white bg-green-500 rounded-full p-0.5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-tight">
                                {notification.title}
                              </p>
                              <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              {notification.link && (
                                <Link
                                  href={notification.link}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View
                                </Link>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification._id);
                                }}
                                className="text-[10px] font-bold text-zinc-500 hover:text-red-500 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
            </>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-b-2xl">
            <div className="flex items-center justify-between">
              {readNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllRead()}
                  className="text-[11px] font-bold h-7 px-2 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear read
                </Button>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold text-zinc-500 hover:text-black dark:hover:text-white ml-auto"
              >
                View all notifications →
              </Link>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
