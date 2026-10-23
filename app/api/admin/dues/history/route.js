import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// =========================================================
// Bangladesh Timezone Helpers
// =========================================================

const BD_OFFSET = 6 * 60 * 60 * 1000;

function getTodayBD() {
  const now = new Date();
  const bdDate = new Date(now.getTime() + BD_OFFSET);

  return {
    year: bdDate.getUTCFullYear(),
    month: bdDate.getUTCMonth(),
    day: bdDate.getUTCDate(),
  };
}

function getBDStartOfDay(dateString) {
  const date = dateString
    ? new Date(`${dateString}T00:00:00+06:00`)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getBDEndOfDay(dateString) {
  const date = dateString
    ? new Date(`${dateString}T23:59:59.999+06:00`)
    : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatBDDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

// =========================================================
// GET /api/admin/dues/history - Collection History
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

    // 🔍 Query Parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const dateFilter = searchParams.get("dateFilter") || "today";
    const customStartDate = searchParams.get("customStartDate");
    const customEndDate = searchParams.get("customEndDate");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    // =========================================================
    // Build Query
    // =========================================================

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { receiptNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Date filter
    let startDate = null;
    let endDate = null;

    const today = getTodayBD();
    const todayString = formatBDDate(today.year, today.month, today.day);

    switch (dateFilter) {
      case "today": {
        startDate = getBDStartOfDay(todayString);
        endDate = getBDEndOfDay(todayString);
        break;
      }

      case "yesterday": {
        const yesterday = new Date(
          Date.UTC(today.year, today.month, today.day - 1)
        );
        const yesterdayString = formatBDDate(
          yesterday.getUTCFullYear(),
          yesterday.getUTCMonth(),
          yesterday.getUTCDate()
        );
        startDate = getBDStartOfDay(yesterdayString);
        endDate = getBDEndOfDay(yesterdayString);
        break;
      }

      case "week": {
        const current = new Date(Date.UTC(today.year, today.month, today.day));
        const dayOfWeek = current.getUTCDay();
        const daysSinceSaturday = (dayOfWeek + 1) % 7;
        const weekStart = new Date(current);
        weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceSaturday);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

        const startString = formatBDDate(
          weekStart.getUTCFullYear(),
          weekStart.getUTCMonth(),
          weekStart.getUTCDate()
        );
        const endString = formatBDDate(
          weekEnd.getUTCFullYear(),
          weekEnd.getUTCMonth(),
          weekEnd.getUTCDate()
        );

        startDate = getBDStartOfDay(startString);
        endDate = getBDEndOfDay(endString);
        break;
      }

      case "month": {
        const monthStartString = formatBDDate(today.year, today.month, 1);
        const monthEnd = new Date(Date.UTC(today.year, today.month + 1, 0));
        const monthEndString = formatBDDate(
          monthEnd.getUTCFullYear(),
          monthEnd.getUTCMonth(),
          monthEnd.getUTCDate()
        );

        startDate = getBDStartOfDay(monthStartString);
        endDate = getBDEndOfDay(monthEndString);
        break;
      }

      case "custom": {
        if (customStartDate && customEndDate) {
          startDate = getBDStartOfDay(customStartDate);
          endDate = getBDEndOfDay(customEndDate);
        }
        break;
      }

      case "all":
        break;

      default:
        startDate = getBDStartOfDay(todayString);
        endDate = getBDEndOfDay(todayString);
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // =========================================================
    // Fetch Collections
    // =========================================================

    const [collections, totalResults, summary] = await Promise.all([
      db
        .collection("dueCollections")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),

      db.collection("dueCollections").countDocuments(query),

      db
        .collection("dueCollections")
        .aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              totalCollected: { $sum: "$collectionAmount" },
              collectionCount: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalResults / limit));

    // =========================================================
    // Format Response
    // =========================================================

    const formattedCollections = collections.map((col) => ({
      collectionId: col._id.toString(),
      receiptNumber: col.receiptNumber || "N/A",
      saleId: col.saleId?.toString() || "",
      invoiceNumber: col.invoiceNumber || "N/A",
      customerName: col.customerName || "Unknown",
      customerPhone: col.customerPhone || "",
      collectionAmount: Number(col.collectionAmount) || 0,
      paymentMethod: col.paymentMethod || "Cash",
      collectionDate: col.collectionDate,
      note: col.note || "",
      collectedBy: col.collectedBy || "Unknown",
      createdAt: col.createdAt,
    }));

    const summaryData = summary[0] || {
      totalCollected: 0,
      collectionCount: 0,
    };

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: formattedCollections,
        pagination: {
          currentPage: page,
          limit,
          totalResults,
          totalPages,
        },
        summary: {
          totalCollected: Number(summaryData.totalCollected) || 0,
          collectionCount: Number(summaryData.collectionCount) || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Collection History API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load collection history",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
