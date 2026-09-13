import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// =========================================================
// GET /api/products/sales/[id] - Get a single sale by ID
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid sale ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    const sale = await db
      .collection("sales")
      .findOne({ _id: new ObjectId(id) });

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 }
      );
    }

    // Role-based access: employees can only see their own sales
    if (
      session.user.role === "employee" &&
      sale.sellerId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error("Get Sale Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE /api/products/sales/[id] - Delete a sale by ID
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid sale ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    // First, check if sale exists and user has permission
    const sale = await db
      .collection("sales")
      .findOne({ _id: new ObjectId(id) });

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 }
      );
    }

    // Role-based access: employees can only delete their own sales
    if (
      session.user.role === "employee" &&
      sale.sellerId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Handle stock restoration for product items
    const now = new Date();

    // Check if the sale uses the new multi-item format or legacy format
    if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
      // Multi-item format - restore stock for all product items
      for (const item of sale.items) {
        if (
          item.itemType === "product" ||
          (item.saleType === "product" && item.productId)
        ) {
          const productId = item.productId || item.product?._id;
          const quantityToRestore = item.quantity || 0;

          if (productId && quantityToRestore > 0) {
            await db.collection("products").updateOne(
              { _id: new ObjectId(productId) },
              {
                $inc: { stock: quantityToRestore },
                $set: { updatedAt: now },
              }
            );
          }
        }
      }
    } else if (sale.saleType === "product" && sale.productId) {
      // Legacy format - restore stock for single product item
      await db.collection("products").updateOne(
        { _id: new ObjectId(sale.productId) },
        {
          $inc: { stock: sale.quantity || 0 },
          $set: { updatedAt: now },
        }
      );
    }

    // Delete the sale
    const result = await db
      .collection("sales")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Sale could not be deleted" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
