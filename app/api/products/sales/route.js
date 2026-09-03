import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // 🔥 মঙ্গোডিবি ObjectId ইম্পোর্ট করলাম আইডি ভ্যালিডেশনের জন্য
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 🔐 1. Authentication & Session Check
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    // 📦 2. Request Body
    const body = await req.json();

    let {
      saleType,
      productId,
      customerName,
      customerPhone,
      productName,
      categoryId,
      quantity,
      totalPrice,
      rawExpense,
      paymentMethod,
      paidAmount,
      note,
    } = body;

    // 🔀 সেল টাইপ নরমালাইজ: শুধু "product" অথবা ডিফল্ট "service"
    saleType = saleType === "product" ? "product" : "service";

    // 🧹 3. Clean & Convert Values
    customerName = customerName?.trim() || "";
    customerPhone = customerPhone?.trim() || "";
    productName = productName?.trim() || "";
    categoryId = categoryId?.trim() || "";
    productId = productId?.trim() || "";

    quantity = Number(quantity);
    totalPrice = Number(totalPrice);
    rawExpense = Number(rawExpense || 0);
    paidAmount = Number(paidAmount || 0);

    // ❌ 4. Shared numeric protection (quantity/price/paid for both modes)
    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(totalPrice) ||
      !Number.isFinite(paidAmount)
    ) {
      return Response.json(
        { success: false, message: "Invalid numeric values" },
        { status: 400 },
      );
    }

    if (quantity <= 0 || totalPrice <= 0 || paidAmount < 0) {
      return Response.json(
        {
          success: false,
          message:
            "Quantity and total price must be greater than zero. Paid amount cannot be negative.",
        },
        { status: 400 },
      );
    }

    if (paidAmount > totalPrice) {
      return Response.json(
        {
          success: false,
          message: "Paid amount cannot be greater than Total Price",
        },
        { status: 400 },
      );
    }

    // 🛑 5. Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    const now = new Date();

    // =========================================================
    // 🧮 5b. Resolve item-specific fields per sale type
    //   - product: inventory item → cost from buyRate, no commission, stock guard
    //   - service: category → commission-based (unchanged behavior)
    // =========================================================

    let resolvedProductName = productName;
    let resolvedCategoryId = null;
    let resolvedCategoryName = "";
    let finalRawExpense = 0;
    let commission = 0;
    let productDoc = null;

    if (saleType === "product") {
      // 🔍 Validate & load product
      if (!productId || !ObjectId.isValid(productId)) {
        return Response.json(
          { success: false, message: "A valid product is required" },
          { status: 400 },
        );
      }

      productDoc = await db
        .collection("products")
        .findOne({ _id: new ObjectId(productId) });

      if (!productDoc) {
        return Response.json(
          { success: false, message: "Product not found" },
          { status: 404 },
        );
      }

      // 📦 Block overselling
      const availableStock = Number(productDoc.stock || 0);
      if (availableStock < quantity) {
        return Response.json(
          {
            success: false,
            message: `Insufficient stock (only ${availableStock} left)`,
          },
          { status: 400 },
        );
      }

      resolvedProductName = productDoc.name;
      resolvedCategoryId = productDoc.categoryId
        ? new ObjectId(productDoc.categoryId)
        : null;
      resolvedCategoryName = productDoc.categoryName || "";
      // COGS = buyRate × quantity (server-computed; below-cost sales allowed)
      finalRawExpense = Number(productDoc.buyRate || 0) * quantity;
      // Commission = productDoc.commission % of sale price (same model as services)
      const productCommRate = Number(productDoc.commission || 0);
      commission = Math.round((totalPrice * productCommRate) / 100);
    } else {
      // ❌ Service required fields
      if (!productName || !categoryId) {
        return Response.json(
          {
            success: false,
            message: "Missing required fields (product or category)",
          },
          { status: 400 },
        );
      }

      // Expense must be a valid, non-negative number for services
      if (!Number.isFinite(rawExpense) || rawExpense < 0) {
        return Response.json(
          { success: false, message: "Invalid expense value" },
          { status: 400 },
        );
      }

      if (rawExpense > totalPrice) {
        return Response.json(
          {
            success: false,
            message: "Expense cost cannot exceed the Total Price",
          },
          { status: 400 },
        );
      }

      // 🔍 Validate Category ID
      if (!ObjectId.isValid(categoryId)) {
        return Response.json(
          { success: false, message: "Invalid Category ID format" },
          { status: 400 },
        );
      }

      const categoryData = await db.collection("categories").findOne({
        _id: new ObjectId(categoryId),
      });

      if (!categoryData) {
        return Response.json(
          { success: false, message: "Category not found in database" },
          { status: 404 },
        );
      }

      // 👤 Conditional Customer Validation (service categories only)
      const mandatoryCategories = [
        "DCR",
        "Khajna Payment",
        "Namjari",
        "Khajna Nibondon",
        "Miss Case",
        "Khatian Application",
      ];

      if (mandatoryCategories.includes(categoryData.name)) {
        if (!customerName || customerName.length < 2) {
          return Response.json(
            {
              success: false,
              message: `Customer name is required for ${categoryData.name} category`,
            },
            { status: 400 },
          );
        }

        if (!customerPhone || customerPhone.length < 11) {
          return Response.json(
            {
              success: false,
              message: `Valid phone number is required for ${categoryData.name} category`,
            },
            { status: 400 },
          );
        }
      }

      resolvedProductName = productName;
      resolvedCategoryId = new ObjectId(categoryId);
      resolvedCategoryName = categoryData.name;
      const commissionRate = Number(categoryData.commission || 0);
      commission = Math.round((totalPrice * commissionRate) / 100);
      finalRawExpense = rawExpense;
    }

    // =========================================================
    // 🧾 6. DAILY INVOICE COUNTER
    // Format: INV-YYYYMMDD-00001
    // Example: INV-20260819-00001
    // =========================================================


    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const dateKey = `${year}${month}${day}`;

    const counterResult = await db.collection("counters").findOneAndUpdate(
      {
        _id: `invoice_${dateKey}`,
      },
      {
        $inc: {
          sequence: 1,
        },
        $set: {
          updatedAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    if (!counterResult) {
      throw new Error("Failed to generate invoice counter");
    }

    const sequence = counterResult.sequence;

    const invoiceNumber = `INV-${dateKey}-${String(sequence).padStart(5, "0")}`;

    // =========================================================
    // 🔐 7. Make Sure Invoice Number Is Unique
    // =========================================================

    await db
      .collection("sales")
      .createIndex({ invoiceNumber: 1 }, { unique: true });

    // =========================================================
    // 📊 8. Calculations (item-specific values resolved above)
    // =========================================================

    const total = totalPrice;

    const totalExpense = finalRawExpense + commission;

    const netProfit = Math.round(total - totalExpense);

    const due = Math.max(total - paidAmount, 0);

    // =========================================================
    // 💾 9. Insert Sale
    // =========================================================

    const saleDoc = {
      saleType,

      sellerName: session.user.name || "",
      sellerId: session.user.id,

      // 🧾 Backend generated invoice
      invoiceNumber,

      customerName,
      customerPhone,

      productName: resolvedProductName,

      categoryId: resolvedCategoryId,
      categoryName: resolvedCategoryName,

      quantity,
      totalPrice,

      rawExpense: finalRawExpense,

      paymentMethod,

      paidAmount,

      note: note?.trim() || "",

      // 📊 Calculated values
      total,
      totalExpense,
      netProfit,
      commission,
      due,

      createdAt: now,
    };

    // 🔗 Link the inventory product for product-type sales (enables stock restore on delete)
    if (saleType === "product") {
      saleDoc.productId = new ObjectId(productId);
    }

    const sale = await db.collection("sales").insertOne(saleDoc);

    // =========================================================
    // 🔔 10a. Notification: New sale recorded
    // =========================================================
    try {
      const { createNotification } = await import("@/lib/notify");
      await createNotification({
        userId: "all-admins", // Notify all admins
        type: "sale",
        title: `New Sale Recorded`,
        message: `${saleDoc.customerName || "Customer"} - ৳${saleDoc.total.toLocaleString()} via ${saleDoc.sellerName}`,
        link: `/admin/sales/${sale.insertedId}`,
        metadata: {
          saleId: sale.insertedId.toString(),
          invoiceNumber: saleDoc.invoiceNumber,
          amount: saleDoc.total,
          seller: saleDoc.sellerName,
        },
      });
    } catch (notifyError) {
      // Don't fail the main operation if notification fails
      console.error("Failed to send notification:", notifyError.message);
    }

    // =========================================================
    // 📦 10b. Decrement inventory stock (product sales only, guarded)
    // =========================================================

    if (saleType === "product") {
      await db.collection("products").updateOne(
        { _id: new ObjectId(productId), stock: { $gte: quantity } },
        {
          $inc: { stock: -quantity },
          $set: { updatedAt: now },
        },
      );
    }

    // =========================================================
    // 📈 11. Update Category Statistics
    // =========================================================

    if (resolvedCategoryId) {
      await db.collection("categories").updateOne(
        {
          _id: resolvedCategoryId,
        },
        {
          $inc: {
            totalSales: total,
            totalProfit: netProfit,
            totalCommission: commission,
            saleCount: 1,
          },
          $set: {
            updatedAt: now,
          },
        },
      );
    }

    // =========================================================
    // ✅ 16. Success Response
    // =========================================================

    return Response.json(
      {
        success: true,
        message: "Sale recorded successfully",

        saleId: sale.insertedId,

        data: {
          invoiceNumber,

          total,
          totalExpense,
          netProfit,
          commission,
          due,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("SALE API ERROR:", error);

    // Duplicate invoice protection
    if (error?.code === 11000) {
      return Response.json(
        {
          success: false,
          message: "Invoice number already exists. Please try again.",
        },
        { status: 409 },
      );
    }

    return Response.json(
      {
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    // ১. সেশন থেকে ইউজার ভ্যালিডেশন
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // ২. ডাটাবেজ কানেকশন
    const client = await clientPromise;
    const db = client.db("products");
    const salesCollection = db.collection("sales");

    // ৩. কোয়েরি প্যারামিটার্স রিড করা
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const searchTerm = searchParams.get("search") || "";

    // 🔄 "all" অপশনটি পুরোপুরি রিমুভ করা হয়েছে। এখন ডিফল্ট ফিল্টার হিসেবে "today" থাকবে।
    const dateFilter = searchParams.get("dateFilter") || "today";
    const customStartDate = searchParams.get("customStartDate");
    const customEndDate = searchParams.get("customEndDate");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // 🔒 সেলার আইডি কোয়েরি ফিক্সড রাখা হয়েছে
    let query = { sellerId: userId };

    if (category) {
      query.categoryId = new ObjectId(category);
    }
    // ৪. সার্চ ফিল্টার (প্রোডাক্ট নেম বা ইনভয়েস নাম্বার)
    if (searchTerm) {
      query.$or = [
        { productName: { $regex: searchTerm, $options: "i" } },
        { invoiceNumber: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // ৫. ডেট ফিল্টারিং লজিক (ইউজারকে অবশ্যই ডেট ভিত্তিক ফিল্টারের মধ্য দিয়েই ডাটা দেখতে হবে)
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
      case "today":
      default:
        // ডিফল্টভাবে আজকের (today) ডেট রেঞ্জ সেট করাই আছে
        break;
    }

    // কোয়েরিতে ডেট রেঞ্জ অবজেক্ট যুক্ত করা হলো (যা এখন বাধ্যতামূলক)
    query.createdAt = { $gte: startDate, $lte: endDate };

    // ৬. নির্দিষ্ট ইউজারের সেলস লিস্ট নিয়ে আসা
    const sales = await salesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalSalesCount = await salesCollection.countDocuments(query);

    // ७. শুধু ঐ ইউজারের ডেটার ওপর ভিত্তি করে এগ্রিগেশন (Summary) বের করা
    const summaryData = await salesCollection
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSalesAmount: { $sum: "$totalPrice" },
            totalProfit: { $sum: "$netProfit" },
            totalCommission: { $sum: "$commission" },
          },
        },
      ])
      .toArray();

    const summary = summaryData[0] || {
      totalSalesAmount: 0,
      totalProfit: 0,
      totalCommission: 0,
    };

    // ৮. সাকসেস রেসপন্স রিটার্ন
    return NextResponse.json(
      {
        success: true,
        data: sales,
        pagination: {
          totalResults: totalSalesCount,
          totalPages: Math.ceil(totalSalesCount / limit),
          currentPage: page,
        },
        summary,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sales API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
