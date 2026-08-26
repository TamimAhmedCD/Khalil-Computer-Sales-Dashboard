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
