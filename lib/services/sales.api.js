export const deleteSale = async (id) => {
  const { data } = await axiosInstance.delete(`/api/products/sales/${id}`);
  return data;
};
