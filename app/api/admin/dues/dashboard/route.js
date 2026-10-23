import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// GET /api/admin/dues/dashboard - Due Collection Dashboard Summary
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

    // Only admin and employees can view dues
    const allowedRoles = ["admin", "superAdmin", "employee"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 📦 Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    // Helper: Bangladesh timezone dates
    const getBDDate = () => {
      const now = new Date();
      const bdTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
      return bdTime;
    };

    const getBDStartOfDay = (date) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      return start;
    };

    const getBDEndOfDay = (date) => {
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return end;
    };

    const bdNow = getBDDate();
    const bdToday = getBDStartOfDay(bdNow);
    const bdTomorrow = getBDEndOfDay(bdNow);

    // Start of current month
    const bdMonthStart = new Date(bdNow.getFullYear(), bdNow.getMonth(), 1);
    bdMonthStart.setHours(0, 0, 0, 0);

    // =========================================================
    // 1. Total Outstanding Due (across all sales)
    // =========================================================
    const totalOutstandingResult = await db
      .collection("sales")
      .aggregate([
        {
          $lookup: {
            from: "dueCollections",
            localField: "_id",
            foreignField: "saleId",
            as: "collections",
          },
        },
        {
          $addFields: {
            collectedSoFar: { $sum: "$collections.collectionAmount" },
            remainingDue: {
              $subtract: [
                { $ifNull: ["$due", 0] },
                { $sum: "$collections.collectionAmount" },
              ],
            },
          },
        },
        {
          $match: {
            remainingDue: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalOutstandingDue: { $sum: "$remainingDue" },
          },
        },
      ])
      .toArray();

    const totalOutstandingDue = totalOutstandingResult[0]?.totalOutstandingDue || 0;

    // =========================================================
    // 2. Collected Today (BD timezone)
    // =========================================================
    const collectedTodayResult = await db
      .collection("dueCollections")
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: bdToday,
              $lte: bdTomorrow,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$collectionAmount" },
          },
        },
      ])
      .toArray();

    const collectedToday = collectedTodayResult[0]?.total || 0;

    // =========================================================
    // 3. Collected This Month (BD timezone)
    // =========================================================
    const collectedThisMonthResult = await db
      .collection("dueCollections")
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: bdMonthStart,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$collectionAmount" },
          },
        },
      ])
      .toArray();

    const collectedThisMonth = collectedThisMonthResult[0]?.total || 0;

    // =========================================================
    // 4. Customers with Outstanding Due
    // =========================================================
    const customersWithDueResult = await db
      .collection("sales")
      .aggregate([
        {
          $match: {
            customerPhone: { $ne: "", $exists: true },
          },
        },
        {
          $lookup: {
            from: "dueCollections",
            localField: "_id",
            foreignField: "saleId",
            as: "collections",
          },
        },
        {
          $addFields: {
            remainingDue: {
              $subtract: [
                { $ifNull: ["$due", 0] },
                { $sum: "$collections.collectionAmount" },
              ],
            },
          },
        },
        {
          $match: {
            remainingDue: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: "$customerPhone",
          },
        },
        {
          $count: "total",
        },
      ])
      .toArray();

    const customersWithDue = customersWithDueResult[0]?.total || 0;

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          totalOutstandingDue: Number(totalOutstandingDue) || 0,
          collectedToday: Number(collectedToday) || 0,
          collectedThisMonth: Number(collectedThisMonth) || 0,
          customersWithDue: Number(customersWithDue) || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Due Dashboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
