import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getDueDashboard = () => api.get("/admin/dues/dashboard").then((r) => r.data);
export const getDueCustomers = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);
  return api.get(`/admin/dues/customers?${params.toString()}`).then((r) => r.data);
};
export const getCustomerDueDetail = (phone) => api.get(`/admin/dues/customers/${encodeURIComponent(phone)}`).then((r) => r.data);
export const collectDue = (data) => api.post("/admin/dues/collect", data).then((r) => r.data);
export const getDueCollection = (id) => api.get(`/admin/dues/collect/${id}`).then((r) => r.data);
export const getDueHistory = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.dateFilter) params.append("dateFilter", filters.dateFilter);
  if (filters.page) params.append("page", filters.page);
  return api.get(`/admin/dues/history?${params.toString()}`).then((r) => r.data);
};
export const getCollectionReceipt = (receiptNumber) => api.get(`/admin/dues/receipt/${encodeURIComponent(receiptNumber)}`).then((r) => r.data);
