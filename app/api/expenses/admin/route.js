import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// =========================================================
// CONFIG
// =========================================================

const BD_OFFSET = 6 * 60 * 60 * 1000;
const ITEMS_PER_PAGE = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// =========================================================
// DATE HELPERS (Bangladesh timezone)
// =========================================================

function getBDToday() {
  const now = new Date();
  const bd = new Date(now.getTime() + BD_OFFSET);
  return {
    year: bd.getUTCFullYear(),
    month: bd.getUTCMonth(),
    day: bd.getUTCDate(),
  };
}

function formatBDDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getBDStartOfDay(dateString) {
  const date = new Date(`${dateString}T00:00:00+06:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getBDEndOfDay(dateString) {
  const date = new Date(`${dateString}T23:59:59.999+06:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateRange(dateFilter, customStartDate, customEndDate) {
  const today = getBDToday();
  const todayString = formatBDDate(today.year, today.month, today.day);

  switch (dateFilter) {
    case "today":
      return { start: getBDStartOfDay(todayString), end: getBDEndOfDay(todayString) };

    case "yesterday": {
      const yesterday = new Date(Date.UTC(today.year, today.month, today.day - 1));
      const dateString = formatBDDate(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate());
      return { start: getBDStartOfDay(dateString), end: getBDEndOfDay(dateString) };
    }

    case "week": {
      const current = new Date(Date.UTC(today.year, today.month, today.day));
      const dayOfWeek = current.getUTCDay();
      const daysSinceSaturday = (dayOfWeek + 1) % 7;
      const weekStart = new Date(current);
      weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceSaturday);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      const startString = formatBDDate(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate());
      const endString = formatBDDate(weekEnd.getUTCFullYear(), weekEnd.getUTCMonth(), weekEnd.getUTCDate());
      return { start: getBDStartOfDay(startString), end: getBDEndOfDay(endString) };
    }

    case "month": {
      const startString = formatBDDate(today.year, today.month, 1);
      const monthEnd = new Date(Date.UTC(today.year, today.month + 1, 0));
      const endString = formatBDDate(monthEnd.getUTCFullYear(), monthEnd.getUTCMonth(), monthEnd.getUTCDate());
      return { start: getBDStartOfDay(startString), end: getBDEndOfDay(endString) };
    }

    case "last-month": {
      const start = new Date(Date.UTC(today.year, today.month - 1, 1));
      const end = new Date(Date.UTC(today.year, today.month, 0));
      const startString = formatBDDate(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const endString = formatBDDate(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
      return { start: getBDStartOfDay(startString), end: getBDEndOfDay(endString) };
    }

    case "year": {
      const startString = formatBDDate(today.year, 0, 1);
      const endString = formatBDDate(today.year, 11, 31);
      return { start: getBDStartOfDay(startString), end: getBDEndOfDay(endString) };
    }

    case "custom": {
      if (!customStartDate || !customEndDate) {
        return { error: "Custom date range requires both start and end dates" };
      }
      const start = getBDStartOfDay(customStartDate);
      const end = getBDEndOfDay(customEndDate);
      if (!start || !end) return { error: "Invalid custom date range" };
      if (start > end) return { error: "Start date cannot be greater than end date" };
      return { start, end };
    }

    case "all":
      return { start: null, end: null };

    default:
      return { start: getBDStartOfDay(todayString), end: getBDEndOfDay(todayString) };
  }
}

// =========================================================
// UPLOAD HELPER
// =========================================================

const uploadBuffer = async (file) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "khalil-computer/expenses", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

const destroyImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary destroy failed:", publicId, err?.message);
  }
};

// =========================================================
// GENERATE EXPENSE NUMBER
// =========================================================

async function generateExpenseNumber(db) {
  const now = new Date();
  const year = now.getFullYear();

  const counterResult = await db.collection("counters").findOneAndUpdate(
    { _id: `expense_${year}` },
    { $inc: { sequence: 1 }, $set: { updatedAt: now } },
    { upsert: true, returnDocument: "after" },
  );

  if (!counterResult) throw new Error("Failed to generate expense number");

  const sequence = counterResult.sequence;
  return `EXP-${year}-${String(sequence).padStart(4, "0")}`;
}

// OPTIMIZED GET ROUTE - Replace the existing GET function with this

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const dateFilter = searchParams.get("dateFilter") || "today";
    const category = searchParams.get("category") || "all";
    const scope = searchParams.get("scope") || "all";
    const customStartDate = searchParams.get("customStartDate");
    const customEndDate = searchParams.get("customEndDate");
    const page = parseInt(searchParams.get("page")) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Date range
    const dateRange = getDateRange(dateFilter, customStartDate, customEndDate);
    if (dateRange.error) {
      return NextResponse.json({ success: false, message: dateRange.error }, { status: 400 });
    }

    // Build optimized queries
    const manualQuery = {};
    const salesQuery = {};

    // Date filters
    if (dateRange.start && dateRange.end) {
      manualQuery.expenseDate = { $gte: dateRange.start, $lte: dateRange.end };
      salesQuery.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
    }

    // Category filter
    const skipSales = category !== "all" && category?.length === 24;
    if (skipSales) {
      manualQuery.categoryId = category;
    }

    // Scope filter
    if (scope !== "all") {
      manualQuery.expenseScope = scope;
      // Sales are always "Business" scope
      if (scope !== "Business") {
        // Skip sales if filtering for non-Business scopes
        salesQuery._id = null; // This will return no results
      }
    }

    // Search filter
    if (search) {
      manualQuery.$or = [
        { expenseNumber: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    // Execute parallel queries with projections
    const fetchSales = !skipSales && salesQuery._id !== null;

    const [manualExpenses, salesRecords] = await Promise.all([
      db.collection("expenses")
        .find(manualQuery)
        .project({
          expenseNumber: 1,
          title: 1,
          amount: 1,
          categoryId: 1,
          categoryName: 1,
          expenseDate: 1,
          expenseScope: 1,
          vendorName: 1,
          createdAt: 1,
        })
        .sort({ expenseDate: -1, createdAt: -1 })
        .toArray(),
      fetchSales
        ? db.collection("sales")
            .find(salesQuery)
            .project({
              invoiceNumber: 1,
              productName: 1,
              customerName: 1,
              rawExpense: 1,
              commission: 1,
              createdAt: 1,
            })
            .sort({ createdAt: -1 })
            .toArray()
        : Promise.resolve([]),
    ]);

    // Transform sales
    let saleExpenses = salesRecords.map((sale) => ({
      _id: sale._id,
      expenseNumber: sale.invoiceNumber || `SALE-${sale._id.toString().slice(-6)}`,
      title: `Sale - ${sale.productName || sale.customerName || "Customer"}`,
      amount: (sale.rawExpense || 0) + (sale.commission || 0),
      categoryName: "Sales Expense",
      categoryId: "sale",
      expenseDate: sale.createdAt,
      expenseScope: "Business",
      createdAt: sale.createdAt,
      source: "sale",
    }));

    // Apply search to sales if needed
    if (search) {
      saleExpenses = saleExpenses.filter((exp) =>
        exp.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
        exp.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Combine and sort
    let allExpenses = [...manualExpenses, ...saleExpenses];
    allExpenses.sort((a, b) => {
      const dateA = new Date(a.expenseDate || a.createdAt);
      const dateB = new Date(b.expenseDate || b.createdAt);
      return dateB - dateA;
    });

    // Pagination
    const totalExpenses = allExpenses.length;
    const paginatedExpenses = allExpenses.slice(skip, skip + ITEMS_PER_PAGE);

    // Optimized summary with aggregation
    const today = getBDToday();
    const todayString = formatBDDate(today.year, today.month, today.day);
    const todayStart = getBDStartOfDay(todayString);
    const todayEnd = getBDEndOfDay(todayString);
    const monthStart = getBDStartOfDay(formatBDDate(today.year, today.month, 1));
    const yearStart = getBDStartOfDay(formatBDDate(today.year, 0, 1));

    const [manualSummary, salesSummary] = await Promise.all([
      db.collection("expenses").aggregate([
        {
          $facet: {
            today: [
              { $match: { expenseDate: { $gte: todayStart, $lte: todayEnd } } },
              { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
            ],
            month: [
              { $match: { expenseDate: { $gte: monthStart, $lte: todayEnd } } },
              { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
            ],
            allTime: [
              { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
            ],
          },
        },
      ]).toArray(),
      db.collection("sales").aggregate([
        {
          $facet: {
            today: [
              { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
              {
                $group: {
                  _id: null,
                  total: { $sum: { $add: [{ $ifNull: ["$rawExpense", 0] }, { $ifNull: ["$commission", 0] }] } },
                  count: { $sum: 1 },
                },
              },
            ],
            month: [
              { $match: { createdAt: { $gte: monthStart, $lte: todayEnd } } },
              {
                $group: {
                  _id: null,
                  total: { $sum: { $add: [{ $ifNull: ["$rawExpense", 0] }, { $ifNull: ["$commission", 0] }] } },
                  count: { $sum: 1 },
                },
              },
            ],
            allTime: [
              {
                $group: {
                  _id: null,
                  total: { $sum: { $add: [{ $ifNull: ["$rawExpense", 0] }, { $ifNull: ["$commission", 0] }] } },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]).toArray(),
    ]);

    const getSummary = (result, facet) => result[0]?.[facet]?.[0] || { total: 0, count: 0 };

    const todayTotal = getSummary(manualSummary, "today").total + getSummary(salesSummary, "today").total;
    const monthTotal = getSummary(manualSummary, "month").total + getSummary(salesSummary, "month").total;
    const allTimeTotal = getSummary(manualSummary, "allTime").total + getSummary(salesSummary, "allTime").total;
    const totalTransactions = getSummary(manualSummary, "allTime").count + getSummary(salesSummary, "allTime").count;

    // Get categories for dropdown
    const categories = await db.collection("expenseCategories").find({}).sort({ name: 1 }).toArray();

    return NextResponse.json({
      success: true,
      data: {
        expenses: paginatedExpenses,
        categories,
        summary: {
          todayTotal,
          monthTotal,
          yearTotal: monthTotal, // Simplified - you can add year aggregation if needed
          totalAmount: allTimeTotal,
          totalTransactions,
        },
        pagination: {
          totalResults: totalExpenses,
          totalPages: Math.ceil(totalExpenses / ITEMS_PER_PAGE),
          currentPage: page,
          pageSize: ITEMS_PER_PAGE,
        },
      },
    });
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST - Create new expense
// =========================================================

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const formData = await request.formData();

    const title = formData.get("title")?.toString().trim() || "";
    const amount = Number(formData.get("amount"));
    const categoryId = formData.get("categoryId")?.toString().trim() || "";
    const expenseDateStr = formData.get("expenseDate")?.toString().trim() || "";
    const note = formData.get("note")?.toString().trim() || "";

    // Validation
    if (!title || title.length < 2) {
      return NextResponse.json({ success: false, message: "Expense title is required" }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: "Valid amount is required" }, { status: 400 });
    }

    if (!categoryId || categoryId.length !== 24) {
      return NextResponse.json({ success: false, message: "Valid category is required" }, { status: 400 });
    }

    if (!expenseDateStr) {
      return NextResponse.json({ success: false, message: "Expense date is required" }, { status: 400 });
    }

    // Get category (scope is auto-derived from category)
    const category = await db.collection("expenseCategories").findOne({ _id: new ObjectId(categoryId) });
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    // Parse expense date
    const expenseDate = new Date(`${expenseDateStr}T00:00:00+06:00`);
    if (Number.isNaN(expenseDate.getTime())) {
      return NextResponse.json({ success: false, message: "Invalid expense date" }, { status: 400 });
    }

    // Generate expense number
    const expenseNumber = await generateExpenseNumber(db);

    const now = new Date();
    const expenseDoc = {
      expenseNumber,
      title,
      amount,
      categoryId,
      categoryName: category.name,
      expenseDate,
      paymentMethod: "Cash",
      paidBy: "",
      vendorName: "",
      note,
      // Scope auto-derived from the selected category type
      expenseScope: category.type || "Other",
      createdBy: session.user.id,
      createdByName: session.user.name || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("expenses").insertOne(expenseDoc);

    return NextResponse.json({
      success: true,
      message: "Expense recorded successfully",
      data: { ...expenseDoc, _id: result.insertedId },
    }, { status: 201 });
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create expense" },
      { status: 500 },
    );
  }
}
