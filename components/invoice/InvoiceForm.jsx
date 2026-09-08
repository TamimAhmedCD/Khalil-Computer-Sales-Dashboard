"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, Printer, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateInvoice } from "@/lib/hooks/invoices/useInvoices";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { generateInvoicePDF } from "@/lib/invoice/pdfGenerator";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import axios from "@/lib/axios/axiosInstance";

// Form Schema
const invoiceSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1, "Item name is required"),
      description: z.string().optional(),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit: z.string().default("pcs"),
      unitPrice: z.number().min(0, "Price must be non-negative"),
      discount: z.number().min(0).default(0),
    })
  ).min(1, "At least one item is required"),
  paidAmount: z.number().min(0).default(0),
  paymentMethod: z.string().default("Cash"),
  notes: z.string().optional(),
});

export default function InvoiceForm({ initialData, mode = "create", isEmployee = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("saleId");

  const { mutate: createInvoice, isPending } = useCreateInvoice();
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingSale, setIsLoadingSale] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      items: [
        {
          name: "",
          description: "",
          quantity: 1,
          unit: "pcs",
          unitPrice: 0,
          discount: 0,
        },
      ],
      paidAmount: 0,
      paymentMethod: "Cash",
      notes: "",
    },
  });

  // Load existing sale data if saleId is present
  useEffect(() => {
    if (saleId && mode === "create") {
      const loadSaleData = async () => {
        setIsLoadingSale(true);
        try {
          // Both admin and employee can get the sale details (assuming the role permits the API call)
          const endpoint = `/api/products/sales/${saleId}`;
          const response = await axios.get(endpoint);
          const sale = response.data?.data;

          if (sale) {
            // Automatically fill the form with the sale data
            reset({
              customerName: sale.customerName || "",
              customerPhone: sale.customerPhone || "",
              customerAddress: "",
              items: [
                {
                  name: sale.productName || sale.categoryName || "",
                  description: sale.categoryName || "",
                  quantity: sale.quantity || 1,
                  unit: sale.saleType === "service" ? "service" : "pcs",
                  unitPrice: (sale.totalPrice / (sale.quantity || 1)) || 0,
                  discount: 0,
                },
              ],
              paidAmount: sale.paidAmount || 0,
              paymentMethod: sale.paymentMethod || "Cash",
              notes: sale.note || "",
            });
            toast.success("Loaded sale data into invoice");
          }
        } catch (error) {
          console.error("Failed to load sale data:", error);
          toast.error("Failed to populate invoice with sale data");
        } finally {
          setIsLoadingSale(false);
        }
      };

      loadSaleData();
    }
  }, [saleId, mode, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];
  const watchedPaid = watch("paidAmount") || 0;

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  const totalDiscount = watchedItems.reduce((sum, item) => {
    return sum + (Number(item.discount) || 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const dueAmount = Math.max(0, grandTotal - watchedPaid);

  // Form Submission
  const onSubmit = (data) => {
    createInvoice(data, {
      onSuccess: (res) => {
        if (res?.success) {
          const redirectPath = isEmployee ? "/employee/invoices" : "/admin/invoices";
          router.push(redirectPath);
        }
      },
    });
  };

  // Preview Action
  const handlePreview = () => {
    const formData = watch();
    const processedItems = (formData.items || []).map((item) => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      total:
        (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) -
        (Number(item.discount) || 0),
    }));

    setPreviewData({
      invoiceNumber: "INV-PREVIEW",
      invoiceDate: new Date(),
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      items: processedItems,
      subtotal,
      totalDiscount,
      grandTotal,
      paidAmount: watchedPaid,
      dueAmount,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      createdBy: "Preview User",
    });

    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {showPreview && previewData ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Invoice Preview</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => generateInvoicePDF(previewData)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
          <InvoiceTemplate invoice={previewData} mode="view" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  placeholder="e.g. John Doe"
                  {...register("customerName")}
                />
                {errors.customerName && (
                  <p className="text-sm text-red-500">
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  placeholder="e.g. 017XXXXXXXX"
                  {...register("customerPhone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  placeholder="e.g. Dhaka, Bangladesh"
                  {...register("customerAddress")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Items & Services</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: "",
                    description: "",
                    quantity: 1,
                    unit: "pcs",
                    unitPrice: 0,
                    discount: 0,
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-gray-50/50"
                >
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-xs">Item/Service Name *</Label>
                    <Input
                      placeholder="e.g. Windows Installation"
                      {...register(`items.${index}.name`)}
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Optional notes"
                      {...register(`items.${index}.description`)}
                    />
                  </div>

                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Input
                      placeholder="pcs"
                      {...register(`items.${index}.unit`)}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Price (৳)</Label>
                    <Input
                      type="number"
                      min="0"
                      {...register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs">Disc (৳)</Label>
                    <Input
                      type="number"
                      min="0"
                      {...register(`items.${index}.discount`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    defaultValue="Cash"
                    onValueChange={(val) => setValue("paymentMethod", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="bKash">bKash</SelectItem>
                      <SelectItem value="Nagad">Nagad</SelectItem>
                      <SelectItem value="Rocket">Rocket</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Terms</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g. 7 Days Warranty, Goods once sold are not returnable"
                    {...register("notes")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calculations Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">৳{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-red-600">
                  <span>Total Discount:</span>
                  <span>-৳{totalDiscount.toLocaleString()}</span>
                </div>

                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>৳{grandTotal.toLocaleString()}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="paidAmount">Paid Amount (৳)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    max={grandTotal}
                    {...register("paidAmount", { valueAsNumber: true })}
                  />
                </div>

                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Due Amount:</span>
                  <span
                    className={
                      dueAmount > 0 ? "text-red-500" : "text-green-500"
                    }
                  >
                    ৳{dueAmount.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Invoice
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="w-4 h-4 mr-2" />
              {isPending ? "Saving..." : "Save & Generate Invoice"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
