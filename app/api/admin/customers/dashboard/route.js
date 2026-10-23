import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// GET /api/admin/customers - Customer Dashboard Summary
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

    // 📦 Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    // =========================================================
    // 1. Total Customers (distinct by phone)
    // =========================================================

    const totalCustomersResult = await db
      .collection("sales")
      .aggregate([
        {
          $match: {
            customerPhone: { $ne: "", $exists: true },
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

    const totalCustomers = totalCustomersResult[0]?.total || 0;

    // =========================================================
    // 2. Customers with Outstanding Due
    // =========================================================

    const customersWithDueResult = await db
      .collection("sales")
      .aggregate([
        {
          $match: {
            due: { $gt: 0 },
            customerPhone: { $ne: "", $exists: true },
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

    // =========================================================
    // 3. Total Outstanding Due
    // =========================================================

    const totalOutstandingResult = await db
      .collection("sales")
      .aggregate([
        {
          $match: {
            due: { $gt: 0 },
            customerPhone: { $ne: "", $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalDue: { $sum: "$due" },
          },
        },
      ])
      .toArray();

    const totalOutstandingDue = totalOutstandingResult[0]?.totalDue || 0;

    // =========================================================
    // 4. New Customers This Month
    // =========================================================

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newCustomersResult = await db
      .collection("sales")
      .aggregate([
        {
          $match: {
            customerPhone: { $ne: "", $exists: true },
            createdAt: { $gte: firstDayOfMonth },
          },
        },
        {
          $group: {
            _id: "$customerPhone",
            firstPurchase: { $min: "$createdAt" },
          },
        },
        {
          $match: {
            firstPurchase: { $gte: firstDayOfMonth },
          },
        },
        {
          $count: "total",
        },
      ])
      .toArray();

    const newCustomersThisMonth = newCustomersResult[0]?.total || 0;

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: {
          totalCustomers: Number(totalCustomers) || 0,
          customersWithDue: Number(customersWithDue) || 0,
          totalOutstandingDue: Number(totalOutstandingDue) || 0,
          newCustomersThisMonth: Number(newCustomersThisMonth) || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer Dashboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
