import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin" || session.user.role === "employee")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { saleId, collectionAmount, paymentMethod, collectionDate, note } = body;

    if (!saleId || !collectionAmount) {
      return NextResponse.json({ success: false, message: "saleId and collectionAmount are required" }, { status: 400 });
    }

    const amount = Number(collectionAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid collection amount" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    let saleObjectId;
    try {
      saleObjectId = new ObjectId(saleId);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid sale ID" }, { status: 400 });
    }

    const sale = await db.collection("sales").findOne({ _id: saleObjectId });
    if (!sale) {
      return NextResponse.json({ success: false, message: "Sale not found" }, { status: 404 });
    }

    // Compute current remaining due for this sale
    const totalPrice = Number(sale.totalPrice || sale.total || 0);
    const originalPaid = Number(sale.paidAmount || 0);

    const priorCollections = await db.collection("dueCollections").find({ saleId: saleObjectId }).toArray();
    const collectedSoFar = priorCollections.reduce((sum, c) => sum + Number(c.collectionAmount || 0), 0);
    const currentPaid = originalPaid + collectedSoFar;
    const remainingDue = Math.max(0, totalPrice - currentPaid);

    if (amount > remainingDue) {
      return NextResponse.json({
        success: false,
        message: `Collection amount exceeds remaining due (৳${remainingDue})`,
      }, { status: 400 });
    }

    // Generate unique receipt number: RCP-YYYYMMDD-XXXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateKey = `${year}${month}${day}`;

    const counterResult = await db.collection("counters").findOneAndUpdate(
      { _id: `due_rcpt_${dateKey}` },
      { $inc: { sequence: 1 }, $set: { updatedAt: now } },
      { upsert: true, returnDocument: "after" }
    );

    if (!counterResult) {
      throw new Error("Failed to generate receipt counter");
    }

    const sequence = counterResult.sequence;
    const receiptNumber = `RCP-${dateKey}-${String(sequence).padStart(5, "0")}`;

    const newPaidTotal = currentPaid + amount;
    const newRemainingDue = Math.max(0, totalPrice - newPaidTotal);

    const collectionDoc = {
      receiptNumber,
      saleId: saleObjectId,
      invoiceNumber: sale.invoiceNumber || "",
      customerName: sale.customerName || "Walk-in",
      customerPhone: sale.customerPhone || "",
      collectionAmount: amount,
      paymentMethod: paymentMethod || "Cash",
      collectionDate: collectionDate ? new Date(collectionDate) : now,
      note: note || "",
      collectedBy: session.user.name || "Admin",
      collectedById: session.user.id,
      createdAt: now,
    };

    const insertResult = await db.collection("dueCollections").insertOne(collectionDoc);

    // Update sale paidAmount and due
    await db.collection("sales").updateOne(
      { _id: saleObjectId },
      {
        $set: {
          paidAmount: newPaidTotal,
          due: newRemainingDue,
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        collectionId: insertResult.insertedId.toString(),
        receiptNumber,
        remainingDue: newRemainingDue,
      },
    });
  } catch (error) {
    console.error("COLLECT DUE ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to collect due" }, { status: 500 });
  }
}
