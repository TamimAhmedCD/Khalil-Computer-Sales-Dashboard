import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // 🔥 মঙ্গোডিবি ObjectId ইম্পোর্ট করলাম আইডি ভ্যালিডেশনের জন্য
import { NextResponse } from "next/server";

// Helper function to validate and process a single item
async function processItem(db, item, now) {
  const itemType = item.saleType === "product" ? "product" : "service";

  // Validate quantity and price
  const quantity = Number(item.quantity);
  const totalPrice = Number(item.totalPrice);

  if (!Number.isFinite(quantity) || !Number.isFinite(totalPrice)) {
    return { success: false, message: "Invalid numeric values for item" };
  }

  if (quantity <= 0 || totalPrice < 0) {
    return {
      success: false,
      message: "Quantity must be greater than zero and price cannot be negative."
    };
  }

  const unitPrice = quantity > 0 ? totalPrice / quantity : 0;

  const result = {
    itemType,
    quantity,
    unitPrice,
    totalPrice,
    rawExpense: 0,
    commission: 0,
    commissionRate: 0,
    productName: item.productName?.trim() || "",
    categoryId: null,
    categoryName: "",
    productId: null,
    stockAffected: 0,
    unit: itemType === "product" ? "pcs" : "service",
  };

  if (itemType === "product") {
    // Validate & load product
    if (!item.productId || !ObjectId.isValid(item.productId)) {
      return {
        success: false,
        message: "A valid product is required for product-type items"
      };
    }

    const productDoc = await db
      .collection("products")
      .findOne({ _id: new ObjectId(item.productId) });

    if (!productDoc) {
      return {
        success: false,
        message: `Product not found: ${item.productName}`
      };
    }

    // 📦 Block overselling
    const availableStock = Number(productDoc.stock || 0);
    if (availableStock < quantity) {
      return {
        success: false,
        message: `Insufficient stock for ${productDoc.name} (only ${availableStock} left)`
      };
    }

    result.productId = new ObjectId(item.productId);
    result.categoryId = productDoc.categoryId
      ? new ObjectId(productDoc.categoryId)
      : null;
    result.categoryName = productDoc.categoryName || "";

    // COGS = buyRate × quantity
    result.rawExpense = Number(productDoc.buyRate || 0) * quantity;

    // Commission = productDoc.commission % of sale price
    const productCommRate = Number(productDoc.commission || 0);
    result.commission = Math.round((totalPrice * productCommRate) / 100);
    result.commissionRate = productCommRate;
    result.stockAffected = quantity;
    result.unit = productDoc.unit || "pcs";
  } else {
    // Service type
    if (!item.categoryId || !ObjectId.isValid(item.categoryId)) {
      return {
        success: false,
        message: `Invalid Category ID for service: ${item.productName}`
      };
    }

    const categoryData = await db.collection("categories").findOne({
      _id: new ObjectId(item.categoryId),
    });

    if (!categoryData) {
      return {
        success: false,
        message: `Category not found: ${item.categoryId}`
      };
    }

    // Validate expense
    const rawExpense = Number(item.rawExpense || 0);
    if (!Number.isFinite(rawExpense) || rawExpense < 0) {
      return {
        success: false,
        message: "Invalid expense value for service item"
      };
    }

    if (rawExpense > totalPrice) {
      return {
        success: false,
        message: `Expense cannot exceed Total Price for ${item.productName}`
      };
    }

    result.categoryId = new ObjectId(item.categoryId);
    result.categoryName = categoryData.name;

    // Validate product/service name
    if (!item.productName || item.productName.trim().length < 2) {
      return {
        success: false,
        message: "Product/service name must be at least 2 characters"
      };
    }

    // Commission = category.commission % of sale price
    const commissionRate = Number(categoryData.commission || 0);
    result.commission = Math.round((totalPrice * commissionRate) / 100);
    result.commissionRate = commissionRate;
    result.rawExpense = rawExpense;

    // Check if category requires customer details (dynamic field from database)
    if (categoryData.requiresCustomerInfo === true) {
      const customerName = item.customerName?.trim();
      const customerPhone = item.customerPhone?.trim();

      if (!customerName || customerName.length < 2) {
        return {
          success: false,
          message: `Customer name is required for ${categoryData.name} category`
        };
      }

      if (!customerPhone || customerPhone.length < 11) {
        return {
          success: false,
          message: `Valid 11-digit phone number is required for ${categoryData.name} category`
        };
      }
    }
  }

  return { success: true, item: result };
}

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

    // 🔄 Support both multi-item and single-item (backward compatibility)
    let items = body.items;

    // If no items array provided, create from single-item fields (backward compatibility)
    if (!items) {
      items = [{
        saleType: body.saleType || "service",
        productId: body.productId,
        productName: body.productName,
        categoryId: body.categoryId,
        quantity: body.quantity,
        totalPrice: body.totalPrice,
        rawExpense: body.rawExpense,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
      }];
    }

    // Validate at least one item
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        {
          success: false,
          message: "At least one item is required for a sale"
        },
        { status: 400 },
      );
    }

    // Extract sale-level fields
    let {
      customerName,
      customerPhone,
      paymentMethod,
      paidAmount,
      note,
    } = body;

    // Validate sale-level fields
    paidAmount = Number(paidAmount || 0);

    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return Response.json(
        { success: false, message: "Invalid paid amount" },
        { status: 400 },
      );
    }

    // 🛑 3. Database Connection
    const client = await clientPromise;
    const db = client.db("products");

    const now = new Date();

    // =========================================================
    // 🧮 4. Process each item in the items array
    // =========================================================

    const processedItems = [];
    let total = 0;
    let totalExpense = 0;
    let totalCommission = 0;
    let hasProductItems = false;
    let firstCategoryId = null;
    let firstCategoryName = "";
    let firstProductName = "";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = await processItem(db, item, now);

      if (!result.success) {
        return Response.json(
          {
            success: false,
            message: `Item ${i + 1}: ${result.message}`
          },
          { status: 400 },
        );
      }

      processedItems.push(result.item);

      total += result.item.totalPrice;
      totalExpense += result.item.rawExpense + result.item.commission;
      totalCommission += result.item.commission;

      if (result.item.itemType === "product") {
        hasProductItems = true;
      }

      // Use first category for legacy compatibility
      if (i === 0 && result.item.categoryId) {
        firstCategoryId = result.item.categoryId;
        firstCategoryName = result.item.categoryName;
      }

      if (i === 0 && result.item.productName) {
        firstProductName = result.item.productName;
      }
    }

    // Validate paid amount against total
    if (paidAmount > total) {
      return Response.json(
        {
          success: false,
          message: "Paid amount cannot be greater than Total Price",
        },
        { status: 400 },
      );
    }

    // =========================================================
    // 🧾 5. DAILY INVOICE COUNTER
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
    // 🔐 6. Make Sure Invoice Number Is Unique
    // =========================================================

    await db
      .collection("sales")
      .createIndex({ invoiceNumber: 1 }, { unique: true });

    // =========================================================
    // 📊 7. Calculations
    // =========================================================

    const netProfit = Math.round(total - totalExpense);
    const due = Math.max(total - paidAmount, 0);

    // =========================================================
    // 💾 8. Insert Sale
    // =========================================================

    const saleDoc = {
      // New multi-item format
      saleType: processedItems.length > 1 || (processedItems[0]?.itemType === "mixed") ? "mixed" : processedItems[0]?.itemType || "service",
      items: processedItems,

      sellerName: session.user.name || "",
      sellerId: session.user.id,

      // 🧾 Backend generated invoice
      invoiceNumber,

      // Legacy fields for backward compatibility
      customerName: customerName?.trim() || "",
      customerPhone: customerPhone?.trim() || "",
      productName: firstProductName,

      categoryId: firstCategoryId,
      categoryName: firstCategoryName,

      // Legacy numeric fields (summed for backward compatibility)
      quantity: processedItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: total,
      rawExpense: processedItems.reduce((sum, item) => sum + item.rawExpense, 0),

      paymentMethod: paymentMethod || "Cash",

      paidAmount,

      note: note?.trim() || "",

      // 📊 Calculated values
      total,
      totalExpense,
      netProfit,
      commission: totalCommission,
      due,

      createdAt: now,
    };

    // 🔗 Link the first inventory product for product-type sales (enables stock restore on delete)
    const firstProductItem = processedItems.find(item => item.itemType === "product");
    if (firstProductItem) {
      saleDoc.productId = firstProductItem.productId;
    }

    const sale = await db.collection("sales").insertOne(saleDoc);

    // =========================================================
    // 📦 9. Decrement inventory stock (product sales only, guarded)
    // =========================================================

    for (const item of processedItems) {
      if (item.itemType === "product" && item.stockAffected > 0) {
        await db.collection("products").updateOne(
          { _id: item.productId, stock: { $gte: item.stockAffected } },
          {
            $inc: { stock: -item.stockAffected },
            $set: { updatedAt: now },
          },
        );
      }
    }

    // =========================================================
    // 📈 10. Update Category Statistics
    // =========================================================

    // Update statistics for each unique category
    const categoryStats = new Map();
    for (const item of processedItems) {
      if (item.categoryId) {
        if (!categoryStats.has(item.categoryId.toString())) {
          categoryStats.set(item.categoryId.toString(), {
            categoryId: item.categoryId,
            totalSales: 0,
            totalProfit: 0,
            totalCommission: 0,
            saleCount: 0,
          });
        }
        const stats = categoryStats.get(item.categoryId.toString());
        stats.totalSales += item.totalPrice;
        stats.totalProfit += Math.round(item.totalPrice - item.rawExpense - item.commission);
        stats.totalCommission += item.commission;
        stats.saleCount += 1;
      }
    }

    for (const stats of categoryStats.values()) {
      await db.collection("categories").updateOne(
        { _id: stats.categoryId },
        {
          $inc: {
            totalSales: stats.totalSales,
            totalProfit: stats.totalProfit,
            totalCommission: stats.totalCommission,
            saleCount: stats.saleCount,
          },
          $set: {
            updatedAt: now,
          },
        },
      );
    }

    // =========================================================
    // ✅ 11. Success Response
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
          commission: totalCommission,
          due,
          itemsCount: processedItems.length,
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
        { "items.productName": { $regex: searchTerm, $options: "i" } },
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

    // Normalize sales data (handle both multi-item and legacy format)
    const normalizedSales = sales.map(sale => {
      // If items array exists, use it (multi-item format)
      if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
        return {
          ...sale,
          items: sale.items.map(item => ({
            ...item,
            saleType: item.saleType || item.itemType || "service",
            productName: item.productName || "",
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: Number(item.totalPrice) || 0,
            rawExpense: Number(item.rawExpense) || 0,
            commission: Number(item.commission) || 0,
          })),
        };
      }
      // Legacy format: convert to multi-item structure
      return {
        ...sale,
        items: [{
          saleType: sale.saleType || "service",
          productName: sale.productName || "",
          quantity: Number(sale.quantity) || 0,
          unitPrice: Number(sale.quantity) > 0 ? (Number(sale.totalPrice) || 0) / Number(sale.quantity) : 0,
          totalPrice: Number(sale.totalPrice) || 0,
          rawExpense: Number(sale.rawExpense) || 0,
          commission: Number(sale.commission) || 0,
          productId: sale.productId,
          categoryId: sale.categoryId,
          categoryName: sale.categoryName || "",
          unit: "pcs",
        }],
      };
    });

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
        data: normalizedSales,
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
