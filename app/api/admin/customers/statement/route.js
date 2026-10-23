import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// GET /api/admin/customers/statement - Customer Statement with Date Range
// =========================================================

export async function GET(request) {
  try {
    // 🔐 Authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 📦 Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const customerPhone = searchParams.get("phone");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!customerPhone) {
      return NextResponse.json(
        { success: false, message: "Customer phone is required" },
        { status: 400 }
      );
    }

    // 📦 Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    // =========================================================
    // Build Date Filter
    // =========================================================

    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    // =========================================================
    // Fetch Sales in Date Range
    // =========================================================

    const salesFilter = { customerPhone };
    if (Object.keys(dateFilter).length > 0) {
      salesFilter.createdAt = dateFilter;
    }

    const sales = await db
      .collection("sales")
      .find(salesFilter)
      .sort({ createdAt: 1 })
      .toArray();

    if (sales.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            customerName: "Unknown",
            customerPhone,
            startDate,
            endDate,
            activities: [],
            summary: {
              totalPurchase: 0,
              totalPaid: 0,
              totalOutstanding: 0,
            },
          },
        },
        { status: 200 }
      );
    }

    const customerName = sales[0].customerName || "Unknown";

    // =========================================================
    // Fetch Collections in Date Range
    // =========================================================

    const saleIds = sales.map((s) => s._id);

    const collectionsFilter = { saleId: { $in: saleIds } };
    if (Object.keys(dateFilter).length > 0) {
      collectionsFilter.createdAt = dateFilter;
    }

    const collections = await db
      .collection("dueCollections")
      .find(collectionsFilter)
      .sort({ createdAt: 1 })
      .toArray();

    // =========================================================
    // Build Activity Timeline
    // =========================================================

    const activities = [];

    // Add sales
    sales.forEach((sale) => {
      activities.push({
        type: "sale",
        date: sale.createdAt,
        invoiceNumber: sale.invoiceNumber,
        amount: sale.totalPrice || 0,
        paidAmount: sale.paidAmount || 0,
        dueAmount: sale.due || 0,
        paymentMethod: sale.paymentMethod || "N/A",
      });
    });

    // Add collections
    collections.forEach((collection) => {
      const relatedSale = sales.find(
        (s) => s._id.toString() === collection.saleId.toString()
      );
      activities.push({
        type: "collection",
        date: collection.createdAt,
        receiptNumber: collection.receiptNumber,
        invoiceNumber: relatedSale?.invoiceNumber || "N/A",
        amount: collection.collectionAmount || 0,
        paymentMethod: collection.paymentMethod || "Cash",
        note: collection.note || "",
        collectedBy: collection.collectedBy || "Unknown",
      });
    });

    // Sort activities by date
    activities.sort((a, b) => new Date(a.date) - new Date(b.date));

    // =========================================================
    // Calculate Summary
    // =========================================================

    const totalPurchase = sales.reduce(
      (sum, s) => sum + (s.totalPrice || 0),
      0
    );
    const totalPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);

    // Calculate current outstanding across ALL sales (not just date range)
    const allSales = await db
      .collection("sales")
      .find({ customerPhone })
      .toArray();

    const allSaleIds = allSales.map((s) => s._id);
    const allCollections = await db
      .collection("dueCollections")
      .find({ saleId: { $in: allSaleIds } })
      .toArray();

    const totalOutstanding = allSales.reduce((sum, sale) => {
      const saleCollections = allCollections.filter(
        (c) => c.saleId.toString() === sale._id.toString()
      );
      const collected = saleCollections.reduce(
        (s, c) => s + (c.collectionAmount || 0),
        0
      );
      const remaining = Math.max((sale.due || 0) - collected, 0);
      return sum + remaining;
    }, 0);

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          customerName,
          customerPhone,
          startDate,
          endDate,
          activities,
          summary: {
            totalPurchase: Number(totalPurchase) || 0,
            totalPaid: Number(totalPaid) || 0,
            totalOutstanding: Number(totalOutstanding) || 0,
            salesInPeriod: sales.length,
            collectionsInPeriod: collections.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer Statement API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate customer statement",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
