import axios from "axios";

const API_BASE = "/api/notifications";

// Get notifications
export const getNotifications = async (params = {}) => {
  const { limit = 20, unreadOnly = false } = params;
  const response = await axios.get(API_BASE, {
    params: { limit, unreadOnly },
  });
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (id) => {
  const response = await axios.patch(`${API_BASE}/${id}`);
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const response = await axios.patch(`${API_BASE}/mark-all-read`);
  return response.data;
};

// Delete notification
export const deleteNotification = async (id) => {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
};

// Clear all read notifications
export const clearAllReadNotifications = async () => {
  const response = await axios.delete(`${API_BASE}/clear-all`);
  return response.data;
};

// Create notification (internal use)
export const createNotification = async (data) => {
  const response = await axios.post(API_BASE, data);
  return response.data;
};
