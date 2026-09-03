import axiosInstance from "@/lib/axios/axiosInstance";

// Get all expenses with filters
export const getExpenses = async (filters = {}) => {
  const {
    search,
    dateFilter,
    category,
    paymentMethod,
    paidBy,
    scope,
    customStartDate,
    customEndDate,
    page = 1,
  } = filters;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (dateFilter) params.append("dateFilter", dateFilter);
  if (category) params.append("category", category);
  if (paymentMethod) params.append("paymentMethod", paymentMethod);
  if (paidBy) params.append("paidBy", paidBy);
  if (scope) params.append("scope", scope);
  if (customStartDate) params.append("customStartDate", customStartDate);
  if (customEndDate) params.append("customEndDate", customEndDate);
  params.append("page", page.toString());

  const response = await axiosInstance.get(`/api/expenses/admin?${params}`);
  return response.data;
};

// Get single expense
export const getExpense = async (id) => {
  const response = await axiosInstance.get(`/api/expenses/admin/${id}`);
  return response.data;
};

// Create expense
export const createExpense = async (formData) => {
  const response = await axiosInstance.post("/api/expenses/admin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Update expense
export const updateExpense = async ({ id, formData }) => {
  const response = await axiosInstance.patch(`/api/expenses/admin/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Delete expense
export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/api/expenses/admin/${id}`);
  return response.data;
};

// Category APIs
export const getExpenseCategories = async () => {
  const response = await axiosInstance.get("/api/expenses/categories");
  return response.data;
};

export const createExpenseCategory = async (data) => {
  const response = await axiosInstance.post("/api/expenses/categories", data);
  return response.data;
};

export const updateExpenseCategory = async ({ id, data }) => {
  const response = await axiosInstance.patch(`/api/expenses/categories/${id}`, data);
  return response.data;
};

export const deleteExpenseCategory = async (id) => {
  const response = await axiosInstance.delete(`/api/expenses/categories/${id}`);
  return response.data;
};
