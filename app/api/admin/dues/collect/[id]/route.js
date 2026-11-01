import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const collectionId = resolvedParams?.id;
    if (!collectionId) {
      return NextResponse.json({ success: false, message: "Collection ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    let objId;
    try {
      objId = new ObjectId(collectionId);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid collection ID format" }, { status: 400 });
    }

    const collection = await db.collection("dueCollections").findOne({ _id: objId });
    if (!collection) {
      return NextResponse.json({ success: false, message: "Collection record not found" }, { status: 404 });
    }

    const sale = await db.collection("sales").findOne({ _id: collection.saleId });

    return NextResponse.json({
      success: true,
      data: {
        ...collection,
        sale: sale ? {
          invoiceNumber: sale.invoiceNumber,
          totalPrice: sale.totalPrice || sale.total,
          due: sale.due,
        } : null,
      },
    });
  } catch (error) {
    console.error("GET COLLECTION ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load collection details" }, { status: 500 });
  }
}
