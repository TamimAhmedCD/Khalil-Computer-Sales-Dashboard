"use client";

import React, { useState } from "react";
import { Plus, Edit, Trash2, Tag, Building2, Home, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useExpenseCategories } from "@/lib/hooks/expenses/useExpenseCategories";
import { createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from "@/lib/services/expenses.api";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORY_TYPES = [
  { value: "Business", label: "Business", icon: Building2, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { value: "Household", label: "Household", icon: Home, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { value: "Personal", label: "Personal", icon: User, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { value: "Other", label: "Other", icon: Package, color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
];

export function CategoryManager() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("Business");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: categoriesData, isLoading } = useExpenseCategories();
  const categories = categoriesData?.data || [];
  const queryClient = useQueryClient();

  const groupedCategories = categories.reduce((acc, cat) => {
    const catType = cat.type || "Other";
    if (!acc[catType]) acc[catType] = [];
    acc[catType].push(cat);
    return acc;
  }, {});

  const handleCreate = () => {
    setMode("create");
    setName("");
    setType("Business");
    setDescription("");
    setOpen(true);
  };

  const handleEdit = (category) => {
    setMode("edit");
    setCategoryToEdit(category);
    setName(category.name);
    setType(category.type || "Other");
    setDescription(category.description || "");
    setOpen(true);
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        await createExpenseCategory({ name: name.trim(), type, description: description.trim() });
        toast.success("Category created successfully");
      } else {
        await updateExpenseCategory({
          id: categoryToEdit._id,
          data: { name: name.trim(), type, description: description.trim() },
        });
        toast.success("Category updated successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setLoading(true);
    try {
      await deleteExpenseCategory(categoryToDelete._id);
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setType("Business");
    setDescription("");
    setCategoryToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expense Categories</h2>
          <p className="text-sm text-muted-foreground">Organize expenses by type</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Category Groups */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">No categories yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first category to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_TYPES.map(({ value: catType, label, icon: Icon, color }) => {
            const cats = groupedCategories[catType] || [];
            if (cats.length === 0) return null;

            return (
              <div key={catType}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className={`${color} gap-1.5 px-3 py-1`}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{cats.length} categories</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cats.map((category) => (
                    <div
                      key={category._id}
                      className="group relative p-4 bg-card border border-border/60 rounded-xl hover:border-border hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{category.name}</h4>
                          {category.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create Category" : "Edit Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g., Office Supplies, Rent, Groceries"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-type">Category Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="cat-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (Optional)</Label>
              <Textarea
                id="cat-desc"
                placeholder="Brief description of this category"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
                {loading ? "Saving..." : mode === "create" ? "Create Category" : "Update Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
