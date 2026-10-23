import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// GET /api/admin/dues/customers - Customers with Outstanding Dues
// =========================================================

export async function GET(request) {
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

    // 📦 Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // all, outstanding, partial, paid
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

    // Step 1: Match sales with customer info and due > 0
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

    // Step 3: Calculate original due and collected amount
    pipeline.push({
      $addFields: {
        originalDue: { $ifNull: ["$due", 0] },
        collectedSoFar: { $sum: "$collections.collectionAmount" },
      },
    });

    // Step 4: Calculate remaining due
    pipeline.push({
      $addFields: {
        remainingDue: {
          $subtract: ["$originalDue", "$collectedSoFar"],
        },
      },
    });

    // Step 5: Filter to only sales with remaining due > 0
    pipeline.push({
      $match: {
        remainingDue: { $gt: 0 },
      },
    });

    // Step 6: Group by customer phone
    pipeline.push({
      $group: {
        _id: "$customerPhone",
        customerName: {
          $first: {
            $cond: {
              if: { $ne: ["$customerName", null] },
              then: "$customerName",
              else: "Unknown",
            },
          },
        },
        customerPhone: { $first: "$customerPhone" },
        totalPurchase: { $sum: { $ifNull: ["$totalPrice", 0] } },
        totalPaid: { $sum: { $ifNull: ["$paidAmount", 0] } },
        totalOriginalDue: { $sum: "$originalDue" },
        totalCollected: { $sum: "$collectedSoFar" },
        totalOutstanding: {
          $sum: {
            $cond: {
              if: { $gt: ["$remainingDue", 0] },
              then: "$remainingDue",
              else: 0,
            },
          },
        },
        salesCount: { $sum: 1 },
        lastTransaction: { $max: "$createdAt" },
        firstTransaction: { $min: "$createdAt" },
      },
    });

    // Step 7: Apply search filter
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

    // Step 8: Apply status filter
    if (status === "outstanding") {
      // Has outstanding due
      pipeline.push({
        $match: {
          totalOutstanding: { $gt: 0 },
        },
      });
    } else if (status === "partial") {
      // Partial payments made but still outstanding
      pipeline.push({
        $match: {
          totalOutstanding: { $gt: 0 },
        },
      });
    } else if (status === "paid") {
      // All dues collected
      pipeline.push({
        $match: {
          totalOutstanding: { $eq: 0 },
        },
      });
    }

    // Step 9: Sort by last transaction (recent first)
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

    // Step 10: Pagination
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
    console.error("Due Customers API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load customers with dues",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
