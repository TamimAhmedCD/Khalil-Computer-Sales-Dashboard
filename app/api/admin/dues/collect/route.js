import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// =========================================================
// POST /api/admin/dues/collect - Record a Due Collection
// =========================================================

export async function POST(request) {
  try {
    // 🔐 Authentication - Allow admin and employees
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const allowedRoles = ["admin", "superAdmin", "employee"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    const body = await request.json();
    const { saleId, collectionAmount, paymentMethod, collectionDate, note } = body;

    // Validation
    if (!saleId) {
      return NextResponse.json(
        { success: false, message: "Sale ID is required" },
        { status: 400 }
      );
    }

    if (!collectionAmount || collectionAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Collection amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!collectionDate) {
      return NextResponse.json(
        { success: false, message: "Collection date is required" },
        { status: 400 }
      );
    }

    // Helper: Bangladesh timezone
    const getBDDate = () => {
      const now = new Date();
      return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    };

    const bdNow = getBDDate();
    const todayStr = bdNow.toISOString().split("T")[0];

    // MongoDB session for atomicity
    const sessionMongo = client.startSession();

    let responseData;

    try {
      await sessionMongo.withTransaction(async () => {
        // =========================================================
        // 1. Get the sale document
        // =========================================================
        const sale = await db.collection("sales").findOne({ _id: new ObjectId(saleId) });

        if (!sale) {
          throw new Error("Sale not found");
        }

        // =========================================================
        // 2. Calculate remaining due
        // =========================================================
        const collections = await db
          .collection("dueCollections")
          .find({ saleId: new ObjectId(saleId) })
          .toArray();

        const collectedSoFar = collections.reduce(
          (sum, c) => sum + (c.collectionAmount || 0),
          0
        );
        const originalDue = sale.due || 0;
        const remainingDue = Math.max(originalDue - collectedSoFar, 0);

        if (collectionAmount > remainingDue) {
          throw new Error(
            `Collection amount (${collectionAmount}) cannot exceed remaining due (${remainingDue})`
          );
        }

        // =========================================================
        // 3. Generate unique receipt number
        // =========================================================
        const dateStr = todayStr.replace(/-/g, "");
        const counterDoc = await db.collection("counters").findOneAndUpdate(
          { _id: `receipt_${dateStr}` },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: "after" }
        );

        const seq = counterDoc.seq;
        const receiptNumber = `RCP-${dateStr}-${String(seq).padStart(5, "0")}`;

        // =========================================================
        // 4. Insert collection record
        // =========================================================
        const collectionRecord = {
          saleId: new ObjectId(saleId),
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          collectionAmount: collectionAmount,
          paymentMethod: paymentMethod || "Cash",
          collectionDate: collectionDate,
          note: note || "",
          receiptNumber: receiptNumber,
          collectedBy: session.user.name || "Unknown",
          collectedById: session.user.id,
          createdAt: bdNow,
          updatedAt: bdNow,
        };

        const insertResult = await db.collection("dueCollections").insertOne(collectionRecord);

        // =========================================================
        // 5. Update sale's paidAmount and due
        // =========================================================
        const newPaidAmount = (sale.paidAmount || 0) + collectionAmount;
        const newDue = sale.totalPrice - newPaidAmount;

        await db.collection("sales").updateOne(
          { _id: new ObjectId(saleId) },
          {
            $set: {
              paidAmount: newPaidAmount,
              due: newDue,
              updatedAt: bdNow,
            },
          }
        );

        // =========================================================
        // 6. Prepare response data
        // =========================================================
        const finalRemainingDue = Math.max(newDue, 0);

        responseData = {
          success: true,
          message: "Due collection recorded successfully",
          data: {
            receiptNumber,
            collectionId: insertResult.insertedId.toString(),
            remainingDue: finalRemainingDue,
          },
        };
      });

      // Transaction succeeded, return the response
      return NextResponse.json(responseData, { status: 200 });
    } catch (transactionError) {
      // Re-throw to rollback transaction
      throw transactionError;
    } finally {
      await sessionMongo.endSession();
    }
  } catch (error) {
    console.error("Due Collection API Error:", error);

    // Check if error is from validation
    if (error.message.includes("cannot exceed")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes("Sale not found")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record collection",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
