import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

// GET single sale (for edit page)
export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "ID missing" }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const sale = await db.collection("sales").findOne({
      _id: new ObjectId(id),
      sellerId: session.user.id,
    });

    return NextResponse.json({ data: sale });
  } catch (error) {
    console.log("GET ERROR:", error);

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
// Update sale
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db("products");
    const salesCollection = db.collection("sales");

    // 🔥 Prevent updating restricted fields
    const allowedFields = {
      productName: body.productName,
      categoryName: body.categoryName,
      quantity: body.quantity,
      totalPrice: body.totalPrice,
      expenseCost: body.expenseCost,
      paymentMethod: body.paymentMethod,
      paidAmount: body.paidAmount,
      note: body.note,
    };

    // remove undefined fields
    Object.keys(allowedFields).forEach(
      (key) => allowedFields[key] === undefined && delete allowedFields[key],
    );

    // 🔥 Recalculate profit if needed
    if (allowedFields.totalPrice || allowedFields.expenseCost) {
      const sale = await salesCollection.findOne({
        _id: new ObjectId(id),
      });

      const totalPrice = allowedFields.totalPrice ?? sale.totalPrice;
      const expenseCost = allowedFields.expenseCost ?? sale.expenseCost;

      allowedFields.netProfit = totalPrice - expenseCost;
      allowedFields.commission = (totalPrice - expenseCost) * 0.33; // example rule
    }

    const result = await salesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...allowedFields,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 },
      );
    }

    const updatedSale = await salesCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale,
    });
  } catch (error) {
    console.error("UPDATE SALE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
// DELETE sale
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "ID missing" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    // 🔍 1. আগে sale fetch করো (IMPORTANT)
    const sale = await db.collection("sales").findOne({
      _id: new ObjectId(id),
    });

    if (!sale) {
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });
    }

    // 📉 2. category reverse update (DECREMENT)
    if (sale.categoryId) {
      await db.collection("categories").updateOne(
        { _id: new ObjectId(sale.categoryId) },
        {
          $inc: {
            saleCount: -1,
            totalSales: -(sale.totalPrice || 0),
            totalProfit: -(sale.netProfit || 0),
            totalCommission: -(sale.commission || 0),
          },
          $set: {
            updatedAt: new Date(),
          },
        },
      );
    }

    // 🗑️ 3. delete sale
    const result = await db.collection("sales").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Failed to delete sale" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sale deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
