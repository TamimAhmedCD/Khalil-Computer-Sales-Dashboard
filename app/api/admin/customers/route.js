import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// =========================================================
// GET /api/admin/customers - Customer List with Search & Filter
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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // all, active, inactive
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // 📦 Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    // =========================================================
    // Build Aggregation Pipeline
    // =========================================================

    const pipeline = [];

    // 🔒 Employee: only see own customers
    if (session.user.role === "employee") {
      pipeline.push({ $match: { sellerId: session.user.id } });
    }

    // Step 1: Match sales with customer info
    pipeline.push({
      $match: {
        customerPhone: { $ne: "", $exists: true },
      },
    });

    // Step 2: Lookup collections for each sale
    pipeline.push({
      $lookup: {
        from: "dueCollections",
        localField: "_id",
        foreignField: "saleId",
        as: "collections",
      },
    });

    // Step 3: Calculate remaining due per sale
    pipeline.push({
      $addFields: {
        remainingDue: {
          $subtract: [
            "$due",
            { $sum: "$collections.collectionAmount" },
          ],
        },
      },
    });

    // Step 4: Group by customer phone - handle missing fields gracefully
    pipeline.push({
      $group: {
        _id: "$customerPhone",
        customerName: {
          $first: {
            $cond: {
              if: { $ne: ["$customerName", null] },
              then: "$customerName",
              else: "Unknown"
            }
          }
        },
        customerPhone: { $first: "$customerPhone" },
        totalPurchase: { $sum: { $ifNull: ["$totalPrice", 0] } },
        totalPaid: { $sum: { $ifNull: ["$paidAmount", 0] } },
        totalOutstanding: { $sum: { $ifNull: ["$remainingDue", 0] } },
        salesCount: { $sum: 1 },
        lastTransaction: { $max: "$createdAt" },
        firstTransaction: { $min: "$createdAt" },
      },
    });

    // Step 5: Apply search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { customerPhone: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Step 6: Apply status filter
    if (status === "active") {
      // Customers with purchases in last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      pipeline.push({
        $match: {
          lastTransaction: { $gte: ninetyDaysAgo },
        },
      });
    } else if (status === "inactive") {
      // Customers with no purchases in last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      pipeline.push({
        $match: {
          lastTransaction: { $lt: ninetyDaysAgo },
        },
      });
    }

    // Step 7: Sort by last transaction (recent first)
    pipeline.push({
      $sort: { lastTransaction: -1 },
    });

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await db
      .collection("sales")
      .aggregate(countPipeline)
      .toArray();
    const totalCustomers = countResult[0]?.total || 0;

    // Step 8: Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const customers = await db
      .collection("sales")
      .aggregate(pipeline)
      .toArray();

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          customers: customers.map((c) => ({
            customerPhone: c._id,
            customerName: c.customerName || "Unknown",
            totalPurchase: Number(c.totalPurchase) || 0,
            totalPaid: Number(c.totalPaid) || 0,
            totalOutstanding: Number(c.totalOutstanding) || 0,
            salesCount: Number(c.salesCount) || 0,
            lastTransaction: c.lastTransaction,
            firstTransaction: c.firstTransaction,
          })),
          pagination: {
            page,
            limit,
            totalCustomers,
            totalPages: Math.ceil(totalCustomers / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer List API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load customers",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
