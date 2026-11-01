import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const phoneParam = decodeURIComponent(resolvedParams?.phone || "");
    if (!phoneParam) {
      return NextResponse.json({ success: false, message: "Customer phone is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const sales = await db.collection("sales").find({
      $or: [{ customerPhone: phoneParam }, { customerName: phoneParam }]
    }).toArray();

    if (sales.length === 0) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    const saleIds = sales.map((s) => s._id);
    const collections = await db.collection("dueCollections").find({
      saleId: { $in: saleIds }
    }).sort({ createdAt: -1 }).toArray();

    const collectedBySale = {};
    for (const c of collections) {
      const sid = c.saleId?.toString();
      if (sid) {
        collectedBySale[sid] = (collectedBySale[sid] || 0) + Number(c.collectionAmount || 0);
      }
    }

    let totalPurchase = 0;
    let totalPaid = 0;
    let outstandingDue = 0;

    const formattedSales = sales.map((s) => {
      const sid = s._id.toString();
      const totalPrice = Number(s.totalPrice || s.total || 0);
      const originalPaid = Number(s.paidAmount || 0);
      const collected = collectedBySale[sid] || 0;
      const paidSoFar = originalPaid + collected;
      const remaining = Math.max(0, totalPrice - paidSoFar);

      totalPurchase += totalPrice;
      totalPaid += paidSoFar;
      outstandingDue += remaining;

      return {
        _id: s._id,
        invoiceNumber: s.invoiceNumber || "",
        total: totalPrice,
        paidAmount: paidSoFar,
        originalDue: Number(s.due || 0),
        collectedSoFar: collected,
        remainingDue: remaining,
        date: s.createdAt ? new Date(s.createdAt).toISOString() : null,
      };
    });

    const customerName = sales[0]?.customerName || "Customer";
    const customerPhone = sales[0]?.customerPhone || phoneParam;

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          name: customerName,
          phone: customerPhone,
          totalPurchase,
          totalPaid,
          outstandingDue,
          salesCount: sales.length,
        },
        sales: formattedSales,
        collections: collections.map((c) => ({
          _id: c._id,
          receiptNumber: c.receiptNumber || "",
          invoiceNumber: c.invoiceNumber || "",
          collectionAmount: Number(c.collectionAmount || 0),
          paymentMethod: c.paymentMethod || "Cash",
          note: c.note || "",
          collectedBy: c.collectedBy || "",
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
        })),
      },
    });
  } catch (error) {
    console.error("CUSTOMER DUE DETAIL ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load customer due details" }, { status: 500 });
  }
}
