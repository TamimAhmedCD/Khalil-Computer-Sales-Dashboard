import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// =========================================================
// POST /api/invoices - Create a new invoice
// =========================================================
export async function POST(req) {
  try {
    // 🔐 Authentication
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 📦 Request Body
    const body = await req.json();

    const {
      customerName,
      customerPhone,
      customerAddress,
      items, // Array of { name, description, quantity, unit, unitPrice, discount }
      paidAmount,
      paymentMethod,
      notes,
      saleId, // Optional: if this invoice is linked to an existing sale
    } = body;

    // 🧹 Validation
    if (!customerName || customerName.trim().length < 2) {
      return Response.json(
        { success: false, message: "Customer name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { success: false, message: "At least one item is required" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.name || item.name.trim() === "") {
        return Response.json(
          { success: false, message: "All items must have a name" },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return Response.json(
          { success: false, message: "Item quantity must be greater than zero" },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        return Response.json(
          { success: false, message: "Item unit price must be valid" },
          { status: 400 }
        );
      }
    }

    const client = await clientPromise;
    const db = client.db("products");
    const now = new Date();

    // =========================================================
    // 🧾 Generate Invoice Number: INV-YYYYMMDD-00001
    // =========================================================
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateKey = `${year}${month}${day}`;

    const counterResult = await db.collection("counters").findOneAndUpdate(
      { _id: `invoice_${dateKey}` },
      {
        $inc: { sequence: 1 },
        $set: { updatedAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!counterResult) {
      throw new Error("Failed to generate invoice counter");
    }

    const sequence = counterResult.sequence;
    const invoiceNumber = `INV-${dateKey}-${String(sequence).padStart(5, "0")}`;

    // =========================================================
    // 📊 Calculate Totals
    // =========================================================
    let subtotal = 0;
    let totalDiscount = 0;

    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const itemSubtotal = qty * price;
      const itemTotal = itemSubtotal - discount;

      subtotal += itemSubtotal;
      totalDiscount += discount;

      return {
        name: item.name.trim(),
        description: item.description?.trim() || "",
        quantity: qty,
        unit: item.unit?.trim() || "pcs",
        unitPrice: price,
        discount: discount,
        total: itemTotal,
      };
    });

    const grandTotal = subtotal - totalDiscount;
    const paid = Number(paidAmount) || 0;
    const due = Math.max(grandTotal - paid, 0);

    // Validate paid amount
    if (paid < 0 || paid > grandTotal) {
      return Response.json(
        { success: false, message: "Invalid paid amount" },
        { status: 400 }
      );
    }

    // =========================================================
    // 💾 Insert Invoice
    // =========================================================
    const invoiceDoc = {
      invoiceNumber,
      invoiceDate: now,

      // Customer info
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || "",
      customerAddress: customerAddress?.trim() || "",

      // Items
      items: processedItems,

      // Totals
      subtotal,
      totalDiscount,
      grandTotal,
      paidAmount: paid,
      dueAmount: due,

      // Payment
      paymentMethod: paymentMethod?.trim() || "Cash",
      notes: notes?.trim() || "",

      // Metadata
      createdBy: session.user.name || "Unknown",
      createdById: session.user.id,
      createdByRole: session.user.role || "employee",

      // Optional sale link
      saleId: saleId && ObjectId.isValid(saleId) ? new ObjectId(saleId) : null,

      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("invoices").insertOne(invoiceDoc);

    // =========================================================
    // 🔔 Notification: New invoice created
    // =========================================================
    try {
      const { createNotification } = await import("@/lib/notify");
      await createNotification({
        userId: "all-admins",
        type: "invoice",
        title: `New Invoice Created`,
        message: `${invoiceDoc.customerName} - ৳${invoiceDoc.grandTotal.toLocaleString()} by ${invoiceDoc.createdBy}`,
        link: `/admin/invoices/${result.insertedId}`,
        metadata: {
          invoiceId: result.insertedId.toString(),
          invoiceNumber: invoiceDoc.invoiceNumber,
          amount: invoiceDoc.grandTotal,
          creator: invoiceDoc.createdBy,
        },
      });
    } catch (notifyError) {
      console.error("Failed to send notification:", notifyError.message);
    }

    // =========================================================
    // ✅ Success Response
    // =========================================================
    return Response.json(
      {
        success: true,
        message: "Invoice created successfully",
        invoiceId: result.insertedId,
        invoiceNumber,
        data: {
          subtotal,
          totalDiscount,
          grandTotal,
          paidAmount: paid,
          dueAmount: due,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("INVOICE API ERROR:", error);

    // Duplicate invoice protection
    if (error?.code === 11000) {
      return Response.json(
        {
          success: false,
          message: "Invoice number already exists. Please try again.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// =========================================================
// GET /api/invoices - Fetch invoices list
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

    const userId = session.user.id;
    const userRole = session.user.role;

    const client = await clientPromise;
    const db = client.db("products");
    const invoicesCollection = db.collection("invoices");

    // 🔍 Query Parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const dateFilter = searchParams.get("dateFilter") || "today";
    const customStartDate = searchParams.get("customStartDate");
    const customEndDate = searchParams.get("customEndDate");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // 🔒 Role-based filtering
    let query = {};

    // Employees only see their own invoices
    if (userRole === "employee") {
      query.createdById = userId;
    }
    // Admin and superAdmin see all invoices

    // 🔍 Search Filter (invoice number or customer name)
    if (searchTerm) {
      query.$or = [
        { invoiceNumber: { $regex: searchTerm, $options: "i" } },
        { customerName: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // 📅 Date Filtering
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    switch (dateFilter) {
      case "yesterday":
        startDate.setDate(today.getDate() - 1);
        endDate.setDate(today.getDate() - 1);
        break;
      case "week":
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case "month":
        startDate.setMonth(today.getMonth(), 1);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case "all":
        query.createdAt = { $exists: true };
        break;
      case "today":
      default:
        break;
    }

    if (dateFilter !== "all") {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // 📋 Fetch invoices
    const invoices = await invoicesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await invoicesCollection.countDocuments(query);

    // 📊 Summary
    const summaryData = await invoicesCollection
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$grandTotal" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
          },
        },
      ])
      .toArray();

    const summary = summaryData[0] || {
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
    };

    // ✅ Success Response
    return NextResponse.json(
      {
        success: true,
        data: invoices,
        pagination: {
          totalResults: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
        },
        summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Invoices API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
