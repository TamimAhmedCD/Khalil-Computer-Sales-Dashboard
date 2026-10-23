import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// =========================================================
// GET /api/admin/customers/[id] - Customer Detail by Phone
// =========================================================

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    // 🔐 Authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params; // id is the customer phone number
    const customerPhone = decodeURIComponent(id);

    if (!customerPhone) {
      return NextResponse.json(
        { success: false, message: "Customer phone is required" },
        { status: 400 }
      );
    }

    // 📦 Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    console.log("Fetching customer detail for phone:", customerPhone);

    // =========================================================
    // Fetch Customer Sales - use customerPhone field
    // =========================================================

    const sales = await db
      .collection("sales")
      .find({ customerPhone: { $eq: customerPhone } })
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Found sales:", sales.length);

    if (sales.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
          customerPhone,
          salesCount: 0
        },
        { status: 404 }
      );
    }

    const customerName = sales[0].customerName || "Unknown";

    // =========================================================
    // Fetch All Collections for This Customer
    // =========================================================

    const saleIds = sales.map((s) => s._id);
    const collections = await db
      .collection("dueCollections")
      .find({ saleId: { $in: saleIds } })
      .sort({ createdAt: -1 })
      .toArray();

    // =========================================================
    // Calculate Remaining Due Per Sale
    // =========================================================

    const salesWithDue = sales.map((sale) => {
      const saleCollections = collections.filter(
        (c) => c.saleId.toString() === sale._id.toString()
      );
      const collectedSoFar = saleCollections.reduce(
        (sum, c) => sum + (c.collectionAmount || 0),
        0
      );
      const originalDue = sale.due || 0;
      const remainingDue = Math.max(originalDue - collectedSoFar, 0);

      return {
        saleId: sale._id.toString(),
        invoiceNumber: sale.invoiceNumber,
        date: sale.createdAt,
        totalPrice: sale.totalPrice || 0,
        paidAmount: sale.paidAmount || 0,
        originalDue: originalDue,
        collectedSoFar,
        remainingDue,
      };
    });

    // =========================================================
    // Format Collection History with Invoice Numbers
    // =========================================================

    const collectionHistory = collections.map((c) => {
      const relatedSale = sales.find(
        (s) => s._id.toString() === c.saleId.toString()
      );
      return {
        collectionId: c._id.toString(),
        receiptNumber: c.receiptNumber,
        invoiceNumber: relatedSale?.invoiceNumber || "N/A",
        collectionAmount: c.collectionAmount || 0,
        paymentMethod: c.paymentMethod || "Cash",
        collectionDate: c.collectionDate,
        note: c.note || "",
        collectedBy: c.collectedBy || "Unknown",
        createdAt: c.createdAt,
      };
    });

    // =========================================================
    // Calculate Totals
    // =========================================================

    const totalPurchase = sales.reduce(
      (sum, s) => sum + (s.totalPrice || 0),
      0
    );
    const totalPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalOutstanding = salesWithDue.reduce(
      (sum, s) => sum + s.remainingDue,
      0
    );

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          customerName,
          customerPhone,
          totalPurchase: Number(totalPurchase) || 0,
          totalPaid: Number(totalPaid) || 0,
          totalOutstanding: Number(totalOutstanding) || 0,
          salesCount: sales.length,
          sales: salesWithDue,
          collections: collectionHistory,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer Detail API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load customer details",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
