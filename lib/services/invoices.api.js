import axios from "@/lib/axios/axiosInstance";

// =========================================================
// Invoice API Service
// =========================================================

export const invoicesApi = {
  // Get all invoices with filtering and pagination
  getAll: async (params = {}) => {
    const response = await axios.get("/api/invoices", { params });
    return response.data;
  },

  // Get a single invoice by ID
  getById: async (id) => {
    const response = await axios.get(`/api/invoices/${id}`);
    return response.data;
  },

  // Create a new invoice
  create: async (data) => {
    const response = await axios.post("/api/invoices", data);
    return response.data;
  },

  // Update an existing invoice
  update: async (id, data) => {
    const response = await axios.put(`/api/invoices/${id}`, data);
    return response.data;
  },

  // Delete an invoice
  delete: async (id) => {
    const response = await axios.delete(`/api/invoices/${id}`);
    return response.data;
  },
};
