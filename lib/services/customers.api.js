import axios from "axios";

const API_BASE = "/api/admin/customers";

// =========================================================
// Customer Dashboard
// =========================================================

export const getCustomerDashboard = async () => {
  const response = await axios.get(`${API_BASE}/dashboard`);
  return response.data;
};

// =========================================================
// Customer List
// =========================================================

export const getCustomers = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await axios.get(`${API_BASE}?${params.toString()}`);
  return response.data;
};

// =========================================================
// Customer Detail
// =========================================================

export const getCustomerDetail = async (phone) => {
  const response = await axios.get(`${API_BASE}/${encodeURIComponent(phone)}`);
  return response.data;
};

// =========================================================
// Customer Statement
// =========================================================

export const getCustomerStatement = async (phone, startDate, endDate) => {
  const params = new URLSearchParams();
  params.append("phone", phone);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await axios.get(`${API_BASE}/statement?${params.toString()}`);
  return response.data;
};
