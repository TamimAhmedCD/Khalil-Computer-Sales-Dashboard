import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// =========================================================
// GET /api/invoices/[id] - Get a single invoice
// =========================================================
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    const invoice = await db
      .collection("invoices")
      .findOne({ _id: new ObjectId(id) });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Role-based access: employees can only see their own invoices
    if (
      session.user.role === "employee" &&
      invoice.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Get Invoice Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// =========================================================
// PUT /api/invoices/[id] - Update an invoice
// =========================================================
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    // Check if invoice exists and user has permission
    const existingInvoice = await db
      .collection("invoices")
      .findOne({ _id: new ObjectId(id) });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Role-based access: employees can only edit their own invoices
    if (
      session.user.role === "employee" &&
      existingInvoice.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      paidAmount,
      paymentMethod,
      notes,
    } = body;

    // Validation
    if (!customerName || customerName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Customer name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one item is required" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.name || item.name.trim() === "") {
        return NextResponse.json(
          { success: false, message: "All items must have a name" },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, message: "Item quantity must be greater than zero" },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        return NextResponse.json(
          { success: false, message: "Item unit price must be valid" },
          { status: 400 }
        );
      }
    }

    // Recalculate totals
    let subtotal = 0;
    let totalDiscount = 0;

    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const itemSubtotal = qty * price;
      const itemTotal = itemSubtotal - discount;

      subtotal += itemSubtotal;
      totalDiscount += discount;

      return {
        name: item.name.trim(),
        description: item.description?.trim() || "",
        quantity: qty,
        unit: item.unit?.trim() || "pcs",
        unitPrice: price,
        discount: discount,
        total: itemTotal,
      };
    });

    const grandTotal = subtotal - totalDiscount;
    const paid = Number(paidAmount) || 0;
    const due = Math.max(grandTotal - paid, 0);

    // Validate paid amount
    if (paid < 0 || paid > grandTotal) {
      return NextResponse.json(
        { success: false, message: "Invalid paid amount" },
        { status: 400 }
      );
    }

    // Update invoice
    const updateDoc = {
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || "",
      customerAddress: customerAddress?.trim() || "",
      items: processedItems,
      subtotal,
      totalDiscount,
      grandTotal,
      paidAmount: paid,
      dueAmount: due,
      paymentMethod: paymentMethod?.trim() || "Cash",
      notes: notes?.trim() || "",
      updatedAt: new Date(),
    };

    await db
      .collection("invoices")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      data: {
        subtotal,
        totalDiscount,
        grandTotal,
        paidAmount: paid,
        dueAmount: due,
      },
    });
  } catch (error) {
    console.error("Update Invoice Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE /api/invoices/[id] - Delete an invoice
// =========================================================
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    // Check if invoice exists and user has permission
    const existingInvoice = await db
      .collection("invoices")
      .findOne({ _id: new ObjectId(id) });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Role-based access: employees can only delete their own invoices
    // Admin can delete any invoice
    if (
      session.user.role === "employee" &&
      existingInvoice.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    await db.collection("invoices").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Delete Invoice Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
