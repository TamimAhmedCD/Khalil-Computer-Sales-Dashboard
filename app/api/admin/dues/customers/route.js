import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "outstanding"; // outstanding, paid, all
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const client = await clientPromise;
    const db = client.db("products");

    const sales = await db.collection("sales").find({}).toArray();
    const collections = await db.collection("dueCollections").find({}).toArray();

    const collectedBySale = {};
    for (const c of collections) {
      const sid = c.saleId?.toString();
      if (sid) {
        collectedBySale[sid] = (collectedBySale[sid] || 0) + Number(c.collectionAmount || 0);
      }
    }

    // Group sales by customer phone (or name if phone is missing)
    const customerMap = {};

    for (const s of sales) {
      const phone = (s.customerPhone || "walk-in").trim();
      const name = (s.customerName || "Walk-in Customer").trim();
      const key = phone || name;

      if (!customerMap[key]) {
        customerMap[key] = {
          customerName: name,
          customerPhone: s.customerPhone || "",
          totalPurchase: 0,
          totalPaid: 0,
          outstandingDue: 0,
          salesCount: 0,
          lastTransactionDate: s.createdAt ? new Date(s.createdAt).getTime() : 0,
          sales: [],
        };
      }

      const sid = s._id.toString();
      const totalPrice = Number(s.totalPrice || s.total || 0);
      const originalPaid = Number(s.paidAmount || 0);
      const collected = collectedBySale[sid] || 0;
      const totalPaidForSale = originalPaid + collected;
      const remainingDue = Math.max(0, totalPrice - totalPaidForSale);

      customerMap[key].totalPurchase += totalPrice;
      customerMap[key].totalPaid += totalPaidForSale;
      customerMap[key].outstandingDue += remainingDue;
      customerMap[key].salesCount += 1;

      const saleTime = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      if (saleTime > customerMap[key].lastTransactionDate) {
        customerMap[key].lastTransactionDate = saleTime;
      }

      customerMap[key].sales.push({
        _id: s._id,
        invoiceNumber: s.invoiceNumber || "",
        totalPrice,
        paidAmount: totalPaidForSale,
        remainingDue,
        date: s.createdAt ? new Date(s.createdAt).toISOString() : null,
      });
    }

    let customers = Object.values(customerMap).map((c) => ({
      ...c,
      lastTransactionDate: c.lastTransactionDate ? new Date(c.lastTransactionDate).toISOString() : null,
      status: c.outstandingDue > 0 ? "outstanding" : "paid",
    }));

    // Filter by status
    if (status === "outstanding") {
      customers = customers.filter((c) => c.outstandingDue > 0);
    } else if (status === "paid") {
      customers = customers.filter((c) => c.outstandingDue <= 0);
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.customerPhone.toLowerCase().includes(q) ||
          c.sales.some((s) => s.invoiceNumber.toLowerCase().includes(q))
      );
    }

    // Sort by outstanding due descending
    customers.sort((a, b) => b.outstandingDue - a.outstandingDue);

    const total = customers.length;
    const paginated = customers.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        customers: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("DUE CUSTOMERS ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load due customers" }, { status: 500 });
  }
}
