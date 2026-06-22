"use client";

import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Shadcn UI Components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Icons
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  Layers,
  TrendingUp,
  Package,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

// Validation Schema
const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  commission: z.coerce.number().min(0, "Min 0%").max(100, "Max 100%"),
  description: z.string().optional(),
  status: z.boolean().default(true),
});

export default function CategoriesPage() {
  const fetchCategories = async () => {
    const res = await axios.get("/api/products/categories");
    return res.data?.data || [];
  };

  const {
    data: categoryData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Separate visibility states for each modal type
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active items being interacted with
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      commission: "",
      description: "",
      status: true,
    },
  });

  const statusValue = watch("status");

  // Handle Create / Update Form Submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let response;
      if (editingCategory) {
        // Update Request
        response = await axios.patch(
          `/api/admin/shop/products/category?id=${editingCategory._id}`,
          data,
        );
      } else {
        // Create Request
        response = await axios.post("/api/admin/shop/products/category", data);
      }

      toast.success(response.data.message || "Category saved successfully");
      refetch();
      closeFormDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Action
  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `/api/admin/shop/products/category?id=${deletingCategory._id}`,
      );
      toast.success(response.data.message || "Category deleted successfully");
      refetch();
      setIsDeleteOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  // Triggered when "Add Category" is pressed
  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: "",
      commission: "",
      description: "",
      status: true,
    });
    setIsFormOpen(true);
  };

  // Triggered when table "Edit" action is pressed
  const openEditModal = (category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("commission", category.commission);
    setValue("description", category.description || "");
    setValue("status", category.status);
    setIsFormOpen(true);
  };

  // Triggered when table "View" action is pressed
  const openViewModal = (category) => {
    setViewingCategory(category);
    setIsViewOpen(true);
  };

  // Triggered when table "Delete" action is pressed
  const openDeleteModal = (category) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  // Reset function for Add/Edit Form
  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    reset({
      name: "",
      commission: "",
      description: "",
      status: true,
    });
  };

  const statCards = [
    {
      title: "Total Categories",
      value: categoryData?.length || 0,
      icon: <Layers className="w-5 h-5 md:w-6 md:h-6" />,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Active Categories",
      value: categoryData?.filter((c) => c.status).length || 0,
      icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "Highest Commission",
      value: categoryData?.length
        ? Math.max(...categoryData.map((c) => c.commission)) + "%"
        : "0%",
      icon: <Package className="w-5 h-5 md:w-6 md:h-6" />,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Most Used Category",
      value:
        categoryData.length > 0
          ? categoryData.reduce((max, c) =>
              (c.saleCount || 0) > (max.saleCount || 0) ? c : max,
            ).name
          : "N/A",
      icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
      color: "bg-orange-500/10 text-orange-600",
    },
  ];

  const filteredCategories = (categoryData || []).filter((cat) =>
    (cat?.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading categories...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load categories
      </div>
    );

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
            Categories
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your product taxonomy and global commissions
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md rounded-xl px-6 h-11"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* 1. Form Dialog (Add & Edit) */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => !open && closeFormDialog()}
      >
        <DialogContent className="sm:max-w-120 rounded-2xl border-border p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-muted/20 border-b border-border">
            <DialogTitle className="text-xl font-bold">
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Modify the configuration and commission updates down below."
                : "Create a new product group and set commission rates."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground ml-1">
                Category Name
              </label>
              <input
                {...register("name")}
                placeholder="e.g. Home Appliances"
                className={`w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  errors.name
                    ? "border-red-500"
                    : "border-border focus:border-primary"
                }`}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground ml-1">
                Global Commission (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...register("commission")}
                placeholder="0.0"
                className={`w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                  errors.commission
                    ? "border-red-500"
                    : "border-border focus:border-primary"
                }`}
              />
              {errors.commission && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">
                  {errors.commission.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground ml-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Describe the types of products in this category..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-foreground">
                  Activate Category
                </label>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  Available to vendors immediately
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue("status", !statusValue)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  statusValue ? "bg-green-600" : "bg-zinc-400"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    statusValue ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeFormDialog}
                className="rounded-xl flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl flex-1 bg-primary shadow-lg shadow-primary/20 h-11"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingCategory ? "Update Category" : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Read-Only View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Category Breakdown
            </DialogTitle>
          </DialogHeader>
          {viewingCategory && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Name
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {viewingCategory.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Status
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold uppercase ${
                      viewingCategory.status
                        ? "bg-green-500/10 text-green-600"
                        : "bg-zinc-500/10 text-zinc-500"
                    }`}
                  >
                    {viewingCategory.status ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Commission Fee
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    <span className="font-black text-sm">৳</span>
                    {(viewingCategory.commission || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Total Sales Count
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {viewingCategory.totalSales || 0}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Generated Profit
                  </p>
                  <p className="text-base font-black text-green-600 mt-0.5">
                    <span className="font-black text-sm">৳</span>
                    {Number(viewingCategory.totalProfit || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">
                  Description
                </p>
                <p className="text-sm text-foreground bg-background border border-border p-3 rounded-xl mt-1 min-h-16 whitespace-pre-wrap">
                  {viewingCategory.description ||
                    "No description provided for this taxonomy item."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button
              className="w-full rounded-xl h-11"
              onClick={() => setIsViewOpen(false)}
            >
              Close View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Confirmation Alert Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border p-6 shadow-2xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-full mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you absolutely sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &quot;{deletingCategory?.name}&quot;
              </span>
              ? This process cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="rounded-xl flex-1 h-11"
              onClick={() => setIsDeleteOpen(false)}
            >
              Keep Category
            </Button>
            <Button
              className="rounded-xl flex-1 bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/10 h-11"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="bg-card border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Categories Table Container */}
      <Card className="bg-card border-border shadow-sm overflow-hidden rounded-2xl">
        <div className="p-4 md:p-6 border-b border-border bg-muted/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Category
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Commission
                </th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total Sales
                </th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Revenue
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.map((category) => (
                <tr
                  key={category._id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  {/* Name */}
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-foreground">
                      {category.name}
                    </span>
                    {category.createdAt && (
                      <p className="text-[10px] text-muted-foreground md:hidden">
                        Created:{" "}
                        {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </td>

                  {/* Commission */}
                  <td className="px-6 py-5 text-sm font-medium">
                    {(category.commission || 0).toFixed(1)}%
                  </td>

                  {/* TOTAL SALES */}
                  <td className="hidden sm:table-cell px-6 py-5 text-sm text-muted-foreground">
                    {category.totalSales || 0}
                  </td>

                  {/* PROFIT */}
                  <td className="hidden sm:table-cell px-6 py-5 text-sm font-bold">
                    <span className="font-black text-sm">৳</span>
                    {Number(category.totalProfit || 0).toLocaleString()}
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                        category?.status
                          ? "bg-green-500/10 text-green-600"
                          : "bg-zinc-500/10 text-zinc-500"
                      }`}
                    >
                      {category?.status ? "active" : "inactive"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openViewModal(category)}
                        className="p-2 rounded-lg hover:bg-background transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                        title="Edit entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(category)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-sm text-muted-foreground"
                  >
                    No matching categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
