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
    const dateFilter = searchParams.get("dateFilter") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const client = await clientPromise;
    const db = client.db("products");

    let query = {};
    if (search) {
      query.$or = [
        { receiptNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    const collections = await db.collection("dueCollections").find(query).sort({ createdAt: -1 }).toArray();
    const total = collections.length;
    const paginated = collections.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        collections: paginated.map((c) => ({
          _id: c._id,
          receiptNumber: c.receiptNumber || "",
          invoiceNumber: c.invoiceNumber || "",
          customerName: c.customerName || "Walk-in",
          customerPhone: c.customerPhone || "",
          collectionAmount: Number(c.collectionAmount || 0),
          paymentMethod: c.paymentMethod || "Cash",
          collectionDate: c.collectionDate ? new Date(c.collectionDate).toISOString() : null,
          note: c.note || "",
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("DUE HISTORY ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load due history" }, { status: 500 });
  }
}
