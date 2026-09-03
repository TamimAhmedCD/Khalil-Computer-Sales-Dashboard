import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// =========================================================
// GET - Single expense detail
// =========================================================

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid expense ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    // First, try to find in manual expenses
    const manualExpense = await db.collection("expenses").findOne({ _id: new ObjectId(id) });

    if (manualExpense) {
      // Get category details
      let categoryName = "Uncategorized";
      if (manualExpense.categoryId) {
        const category = await db.collection("expenseCategories").findOne({
          _id: new ObjectId(manualExpense.categoryId)
        });
        if (category) {
          categoryName = category.name;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          ...manualExpense,
          _id: manualExpense._id.toString(),
          categoryName,
          source: "manual",
        },
      });
    }

    // If not found in manual expenses, check sales
    const sale = await db.collection("sales").findOne({ _id: new ObjectId(id) });

    if (sale) {
      // Transform sale to expense format
      const saleExpense = {
        _id: sale._id,
        expenseNumber: sale.invoiceNumber || `SALE-${sale._id.toString().slice(-6)}`,
        title: `Sale Expense - ${sale.customerName || "Customer"}`,
        amount: (sale.rawExpense || 0) + (sale.commission || 0),
        categoryName: "Sales Expense",
        categoryId: "sale",
        type: "Sale",
        expenseDate: sale.saleDate,
        paymentMethod: sale.paymentMethod || "N/A",
        vendorName: sale.customerName || "",
        note: `Raw Expense: ৳${sale.rawExpense || 0}, Commission: ৳${sale.commission || 0}`,
        expenseScope: "Business",
        attachmentUrl: "",
        createdAt: sale.createdAt,
        source: "sale",
        // Additional sale details
        saleDetails: {
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          saleType: sale.saleType,
          totalAmount: sale.totalAmount,
          rawExpense: sale.rawExpense,
          commission: sale.commission,
          items: sale.items,
        },
      };

      return NextResponse.json({
        success: true,
        data: saleExpense,
      });
    }

    return NextResponse.json(
      { success: false, message: "Expense not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("GET EXPENSE DETAIL ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch expense details" },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH - Update expense (manual only)
// =========================================================

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid expense ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    // Check if it's a manual expense
    const existingExpense = await db.collection("expenses").findOne({ _id: new ObjectId(id) });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found or cannot be edited" },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const title = formData.get("title")?.toString().trim() || "";
    const amount = Number(formData.get("amount"));
    const categoryId = formData.get("categoryId")?.toString().trim() || "";
    const expenseDateStr = formData.get("expenseDate")?.toString().trim() || "";
    const note = formData.get("note")?.toString().trim() || "";

    // Get category and auto-derive scope
    let category = null;
    let expenseScope = existingExpense.expenseScope;

    if (categoryId && categoryId.length === 24) {
      category = await db.collection("expenseCategories").findOne({
        _id: new ObjectId(categoryId)
      });
      if (category) {
        expenseScope = category.type || "Other";
      }
    }

    // Build update object
    const updateData = {
      updatedAt: new Date(),
    };

    if (title && title.length >= 2) updateData.title = title;
    if (Number.isFinite(amount) && amount > 0) updateData.amount = amount;
    if (category) {
      updateData.categoryId = categoryId;
      updateData.categoryName = category.name;
      updateData.expenseScope = expenseScope;
    }
    if (expenseDateStr) {
      const expenseDate = new Date(`${expenseDateStr}T00:00:00+06:00`);
      if (!Number.isNaN(expenseDate.getTime())) {
        updateData.expenseDate = expenseDate;
      }
    }
    if (note !== undefined) updateData.note = note;

    await db.collection("expenses").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updated = await db.collection("expenses").findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE EXPENSE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE - Delete expense (manual only)
// =========================================================

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid expense ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    // Check if it's a manual expense
    const existingExpense = await db.collection("expenses").findOne({ _id: new ObjectId(id) });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found or cannot be deleted" },
        { status: 404 }
      );
    }

    // Delete the expense
    await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("DELETE EXPENSE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
