import axiosInstance from "@/lib/axios/axiosInstance";

// Fetch products for employees with filtering and pagination
export const getEmployeeProducts = async (filters = {}) => {
  const { search, category, page = 1, limit = 12 } = filters;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const response = await axiosInstance.get(`/api/products/employee-products?${params}`);
  return response.data;
};