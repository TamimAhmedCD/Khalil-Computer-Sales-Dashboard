import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin" || session.user.role === "employee")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const receiptNumber = decodeURIComponent(resolvedParams?.receiptNumber || "");
    if (!receiptNumber) {
      return NextResponse.json({ success: false, message: "Receipt number required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const collection = await db.collection("dueCollections").findOne({ receiptNumber });
    if (!collection) {
      return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });
    }

    const sale = await db.collection("sales").findOne({ _id: collection.saleId });

    return NextResponse.json({
      success: true,
      data: {
        receiptNumber: collection.receiptNumber,
        collectionAmount: Number(collection.collectionAmount || 0),
        paymentMethod: collection.paymentMethod || "Cash",
        collectionDate: collection.collectionDate ? new Date(collection.collectionDate).toISOString() : null,
        createdAt: collection.createdAt ? new Date(collection.createdAt).toISOString() : null,
        note: collection.note || "",
        collectedBy: collection.collectedBy || "",
        sale: sale ? {
          invoiceNumber: sale.invoiceNumber || "",
          customerName: sale.customerName || "Walk-in",
          customerPhone: sale.customerPhone || "",
          totalPrice: Number(sale.totalPrice || sale.total || 0),
          due: Number(sale.due || 0),
        } : null,
      },
    });
  } catch (error) {
    console.error("RECEIPT ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load receipt" }, { status: 500 });
  }
}
