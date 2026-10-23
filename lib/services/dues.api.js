import axios from "axios";

const duesApi = axios.create({
  baseURL: "/api/admin/dues",
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// Dashboard
// =========================================================

export const getDueDashboard = async () => {
  try {
    const response = await duesApi.get("/dashboard");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch due dashboard:", error);
    throw error;
  }
};

// =========================================================
// Customers with Dues
// =========================================================

export const getDueCustomers = async (params = {}) => {
  try {
    const response = await duesApi.get("/customers", { params });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch customers with dues:", error);
    throw error;
  }
};

// =========================================================
// Customer Due Detail
// =========================================================

export const getCustomerDueDetail = async (phone) => {
  try {
    const response = await duesApi.get(`/customers/${encodeURIComponent(phone)}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch customer due detail:", error);
    throw error;
  }
};

// =========================================================
// Collect Due
// =========================================================

export const collectDue = async (data) => {
  try {
    const response = await duesApi.post("/collect", data);
    return response.data;
  } catch (error) {
    console.error("Failed to collect due:", error);
    throw error;
  }
};

// =========================================================
// Collection Detail
// =========================================================

export const getDueCollection = async (id) => {
  try {
    const response = await duesApi.get(`/collect/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch due collection:", error);
    throw error;
  }
};

// =========================================================
// Collection History
// =========================================================

export const getDueHistory = async (params = {}) => {
  try {
    const response = await duesApi.get("/history", { params });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch due history:", error);
    throw error;
  }
};

// =========================================================
// Receipt
// =========================================================

export const getCollectionReceipt = async (receiptNumber) => {
  try {
    const response = await duesApi.get(`/receipt/${receiptNumber}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch collection receipt:", error);
    throw error;
  }
};

export default {
  getDueDashboard,
  getDueCustomers,
  getCustomerDueDetail,
  collectDue,
  getDueCollection,
  getDueHistory,
  getCollectionReceipt,
};
