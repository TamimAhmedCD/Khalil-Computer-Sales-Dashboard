import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// GET /api/admin/dues/collect/[id] - Get Collection by ID
// =========================================================

export async function GET(request, { params }) {
  try {
    // 🔐 Authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Valid collection ID is required" },
        { status: 400 }
      );
    }

    // 📦 Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    // =========================================================
    // Fetch collection with sale details
    // =========================================================

    const collection = await db
      .collection("dueCollections")
      .findOne({ _id: new ObjectId(id) });

    if (!collection) {
      return NextResponse.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }

    // Fetch related sale
    const sale = await db
      .collection("sales")
      .findOne({ _id: collection.saleId });

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          collectionId: collection._id.toString(),
          receiptNumber: collection.receiptNumber || "N/A",
          saleId: collection.saleId.toString(),
          invoiceNumber: collection.invoiceNumber || sale?.invoiceNumber || "N/A",
          customerName: collection.customerName || sale?.customerName || "Unknown",
          customerPhone: collection.customerPhone || sale?.customerPhone || "",
          collectionAmount: Number(collection.collectionAmount) || 0,
          paymentMethod: collection.paymentMethod || "Cash",
          collectionDate: collection.collectionDate,
          note: collection.note || "",
          collectedBy: collection.collectedBy || "Unknown",
          collectedById: collection.collectedById || "",
          createdAt: collection.createdAt,
          // Sale info
          saleTotal: Number(sale?.totalPrice) || 0,
          salePaid: Number(sale?.paidAmount) || 0,
          saleRemaining: Number(sale?.due) || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Collection API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load collection",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
