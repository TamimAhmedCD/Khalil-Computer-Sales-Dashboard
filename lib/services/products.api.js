import axiosInstance from "@/lib/axios/axiosInstance";

// FormData payload (fields + image files). Let the browser set the
// multipart boundary — do not hand-set the Content-Type header.
export const addProduct = async (formData) => {
  const { data } = await axiosInstance.post(
    "/api/products/add-product",
    formData,
  );
  return data;
};

export const getProducts = async () => {
  const { data } = await axiosInstance.get("/api/products/add-product");
  return data?.data || [];
};

export const getProduct = async (id) => {
  const { data } = await axiosInstance.get(`/api/products/${id}`);
  return data?.data || null;
};

// FormData payload (fields + kept image ids + new files).
export const updateProduct = async ({ id, formData }) => {
  const { data } = await axiosInstance.patch(
    `/api/products/${id}`,
    formData,
  );
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await axiosInstance.delete(`/api/products/${id}`);
  return data;
};
