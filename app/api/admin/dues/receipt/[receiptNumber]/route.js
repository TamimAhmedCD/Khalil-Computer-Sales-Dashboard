import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// GET /api/admin/dues/receipt/[receiptNumber] - Get Receipt Data
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

    const { receiptNumber } = await params;

    if (!receiptNumber) {
      return NextResponse.json(
        { success: false, message: "Receipt number is required" },
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
      .findOne({ receiptNumber });

    if (!collection) {
      return NextResponse.json(
        { success: false, message: "Receipt not found" },
        { status: 404 }
      );
    }

    // Fetch related sale
    const sale = await db
      .collection("sales")
      .findOne({ _id: collection.saleId });

    // Get collections for this sale to calculate remaining due
    const saleCollections = await db
      .collection("dueCollections")
      .find({ saleId: collection.saleId })
      .toArray();

    const totalCollectedOnSale = saleCollections.reduce(
      (sum, c) => sum + (Number(c.collectionAmount) || 0),
      0
    );

    const remainingDue = Math.max(
      (Number(sale?.due) || 0) - (totalCollectedOnSale - Number(collection.collectionAmount)),
      0
    );

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          // Receipt info
          receiptNumber: collection.receiptNumber,
          collectionId: collection._id.toString(),
          // Customer info
          customerName: collection.customerName || "Unknown",
          customerPhone: collection.customerPhone || "",
          // Sale info
          invoiceNumber: collection.invoiceNumber || sale?.invoiceNumber || "N/A",
          saleTotal: Number(sale?.totalPrice) || 0,
          // Collection info
          collectionAmount: Number(collection.collectionAmount) || 0,
          paymentMethod: collection.paymentMethod || "Cash",
          collectionDate: collection.collectionDate,
          collectionNote: collection.note || "",
          // Employee info
          collectedBy: collection.collectedBy || "Unknown",
          // Remaining due after this collection
          remainingDue,
          // Khalil Computer info
          brandName: "Khalil Computer",
          brandContact: "Barlekha, Moulvibazar, Bangladesh",
          brandPhone: "+880 1715 409109",
          brandWebsite: "khalilcomputer.com",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Receipt API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load receipt",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
