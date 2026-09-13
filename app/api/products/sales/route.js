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

    // 📦 2. Request Body - Support both legacy single-item and new multi-item format
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
      items = [],
    } = body;

    // Determine if multi-item or single-item format
    const isMultiItem = Array.isArray(items) && items.length > 0;

    // 🔀 সেল টাইপ নরমালাইজ: শুধু "product" অথবা ডিফল্ট "service"
    saleType = saleType === "product" ? "product" : "service";

    // 🧹 3. Clean & Convert Values
    customerName = customerName?.trim() || "";
    customerPhone = customerPhone?.trim() || "";
    productName = productName?.trim() || "";
    categoryId = categoryId?.trim() || "";
    productId = productId?.trim() || "";

    paidAmount = Number(paidAmount || 0);

    if (isMultiItem) {
      // Multi-item validation
      if (!Array.isArray(items) || items.length === 0) {
        return Response.json(
          { success: false, message: "Items array must contain at least one item" },
          { status: 400 },
        );
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || typeof item !== "object") {
          return Response.json(
            { success: false, message: `Item ${i + 1} is invalid` },
            { status: 400 },
          );
        }

        // Clean item values
        item.productName = item.productName?.trim() || "";
        item.categoryId = item.categoryId?.trim() || "";
        item.productId = item.productId?.trim() || "";
        item.quantity = Number(item.quantity || 1);
        item.price = Number(item.price || 0);
        item.rawExpense = Number(item.rawExpense || 0);

        if (!Number.isFinite(item.quantity) || !Number.isFinite(item.price)) {
          return Response.json(
            { success: false, message: `Invalid numeric values in item ${i + 1}` },
            { status: 400 },
          );
        }

        if (item.quantity <= 0 || item.price < 0) {
          return Response.json(
            { success: false, message: `Item ${i + 1}: Quantity must be > 0 and price cannot be negative` },
            { status: 400 },
          );
        }
      }

      // Calculate totals from items
      quantity = items.reduce((sum, item) => sum + item.quantity, 0);
      totalPrice = items.reduce((sum, item) => sum + item.price, 0);
      rawExpense = items.reduce((sum, item) => sum + item.rawExpense, 0);
    } else {
      // Legacy single-item validation
      productName = productName?.trim() || "";
      categoryId = categoryId?.trim() || "";
      productId = productId?.trim() || "";

      quantity = Number(quantity);
      totalPrice = Number(totalPrice);
      rawExpense = Number(rawExpense || 0);
    }

    // ❌ 4. Shared numeric protection
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
    // 🧮 5b. Resolve item-specific fields per sale type / multi-item
    //   - product: inventory item → cost from buyRate, commission, stock guard
    //   - service: category → commission-based
    // =========================================================

    let resolvedProductName = productName;
    let resolvedCategoryId = null;
    let resolvedCategoryName = "";
    let finalRawExpense = 0;
    let commission = 0;
    let resolvedItems = [];
    const stockUpdates = [];
    const categoryStatsUpdates = [];

    if (isMultiItem) {
      // Process multi-item array
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemSaleType = item.saleType === "product" || saleType === "product" ? "product" : "service";

        if (itemSaleType === "product") {
          if (!item.productId || !ObjectId.isValid(item.productId)) {
            return Response.json(
              { success: false, message: `Item ${i + 1}: Valid product is required` },
              { status: 400 },
            );
          }

          const productDoc = await db
            .collection("products")
            .findOne({ _id: new ObjectId(item.productId) });

          if (!productDoc) {
            return Response.json(
              { success: false, message: `Item ${i + 1}: Product not found` },
              { status: 404 },
            );
          }

          const availableStock = Number(productDoc.stock || 0);
          if (availableStock < item.quantity) {
            return Response.json(
              {
                success: false,
                message: `Item ${i + 1} (${productDoc.name}): Insufficient stock (only ${availableStock} left)`,
              },
              { status: 400 },
            );
          }

          const itemRawExpense = Number(productDoc.buyRate || 0) * item.quantity;
          const productCommRate = Number(productDoc.commission || 0);
          const itemCommission = Math.round((item.price * productCommRate) / 100);
          const itemProfit = Math.round(item.price - itemRawExpense - itemCommission);

          finalRawExpense += itemRawExpense;
          commission += itemCommission;

          resolvedItems.push({
            saleType: "product",
            productId: new ObjectId(item.productId),
            productName: productDoc.name,
            categoryId: productDoc.categoryId ? new ObjectId(productDoc.categoryId) : null,
            categoryName: productDoc.categoryName || "",
            quantity: item.quantity,
            unit: productDoc.unit || item.unit || "pcs",
            unitPrice: item.quantity > 0 ? item.price / item.quantity : item.price,
            price: item.price,
            rawExpense: itemRawExpense,
            commission: itemCommission,
            commissionRate: productCommRate,
            netProfit: itemProfit,
          });

          stockUpdates.push({
            productId: new ObjectId(item.productId),
            quantity: item.quantity,
          });

          if (productDoc.categoryId) {
            categoryStatsUpdates.push({
              categoryId: new ObjectId(productDoc.categoryId),
              sales: item.price,
              profit: itemProfit,
              commission: itemCommission,
            });
          }
        } else {
          // Service item
          if (!item.productName || !item.categoryId) {
            return Response.json(
              {
                success: false,
                message: `Item ${i + 1}: Missing product name or category`,
              },
              { status: 400 },
            );
          }

          if (!ObjectId.isValid(item.categoryId)) {
            return Response.json(
              { success: false, message: `Item ${i + 1}: Invalid Category ID format` },
              { status: 400 },
            );
          }

          const categoryData = await db.collection("categories").findOne({
            _id: new ObjectId(item.categoryId),
          });

          if (!categoryData) {
            return Response.json(
              { success: false, message: `Item ${i + 1}: Category not found in database` },
              { status: 404 },
            );
          }

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

          const itemRawExpense = Number(item.rawExpense || 0);
          const commissionRate = Number(categoryData.commission || 0);
          const itemCommission = Math.round((item.price * commissionRate) / 100);
          const itemProfit = Math.round(item.price - itemRawExpense - itemCommission);

          finalRawExpense += itemRawExpense;
          commission += itemCommission;

          resolvedItems.push({
            saleType: "service",
            productName: item.productName,
            categoryId: new ObjectId(item.categoryId),
            categoryName: categoryData.name,
            quantity: item.quantity,
            unit: item.unit || "service",
            unitPrice: item.quantity > 0 ? item.price / item.quantity : item.price,
            price: item.price,
            rawExpense: itemRawExpense,
            commission: itemCommission,
            commissionRate: commissionRate,
            netProfit: itemProfit,
          });

          categoryStatsUpdates.push({
            categoryId: new ObjectId(item.categoryId),
            sales: item.price,
            profit: itemProfit,
            commission: itemCommission,
          });
        }
      }

      // Summary naming for multi-item
      if (resolvedItems.length === 1) {
        resolvedProductName = resolvedItems[0].productName;
        resolvedCategoryId = resolvedItems[0].categoryId;
        resolvedCategoryName = resolvedItems[0].categoryName;
      } else {
        resolvedProductName = `${resolvedItems[0].productName} +${resolvedItems.length - 1} more`;
        resolvedCategoryId = resolvedItems[0].categoryId;
        resolvedCategoryName = resolvedItems.map((i) => i.categoryName).filter(Boolean).join(", ");
      }
    } else if (saleType === "product") {
      // 🔍 Legacy single product validation & load
      if (!productId || !ObjectId.isValid(productId)) {
        return Response.json(
          { success: false, message: "A valid product is required" },
          { status: 400 },
        );
      }

      const productDoc = await db
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
      finalRawExpense = Number(productDoc.buyRate || 0) * quantity;
      const productCommRate = Number(productDoc.commission || 0);
      commission = Math.round((totalPrice * productCommRate) / 100);

      resolvedItems.push({
        saleType: "product",
        productId: new ObjectId(productId),
        productName: productDoc.name,
        categoryId: resolvedCategoryId,
        categoryName: resolvedCategoryName,
        quantity,
        unit: productDoc.unit || "pcs",
        unitPrice: quantity > 0 ? totalPrice / quantity : totalPrice,
        price: totalPrice,
        rawExpense: finalRawExpense,
        commission,
        commissionRate: productCommRate,
        netProfit: Math.round(totalPrice - finalRawExpense - commission),
      });

      stockUpdates.push({
        productId: new ObjectId(productId),
        quantity,
      });

      if (resolvedCategoryId) {
        categoryStatsUpdates.push({
          categoryId: resolvedCategoryId,
          sales: totalPrice,
          profit: Math.round(totalPrice - finalRawExpense - commission),
          commission,
        });
      }
    } else {
      // ❌ Legacy single service required fields
      if (!productName || !categoryId) {
        return Response.json(
          {
            success: false,
            message: "Missing required fields (product or category)",
          },
          { status: 400 },
        );
      }

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

      resolvedItems.push({
        saleType: "service",
        productName,
        categoryId: resolvedCategoryId,
        categoryName: resolvedCategoryName,
        quantity,
        unit: "service",
        unitPrice: quantity > 0 ? totalPrice / quantity : totalPrice,
        price: totalPrice,
        rawExpense: finalRawExpense,
        commission,
        commissionRate,
        netProfit: Math.round(totalPrice - finalRawExpense - commission),
      });

      categoryStatsUpdates.push({
        categoryId: resolvedCategoryId,
        sales: totalPrice,
        profit: Math.round(totalPrice - finalRawExpense - commission),
        commission,
      });
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
      saleType: isMultiItem ? (items.every(i => (i.saleType === "product" || saleType === "product")) ? "product" : "service") : saleType,

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

      items: resolvedItems,

      createdAt: now,
    };

    // 🔗 Link the inventory product for product-type sales (legacy property for backwards compatibility)
    if (!isMultiItem && saleType === "product") {
      saleDoc.productId = new ObjectId(productId);
    } else if (isMultiItem && resolvedItems.length === 1 && resolvedItems[0].saleType === "product") {
      saleDoc.productId = resolvedItems[0].productId;
    }

    const sale = await db.collection("sales").insertOne(saleDoc);

    // =========================================================
    // 📦 10b. Decrement inventory stock & Category Statistics
    // =========================================================

    // Update stocks
    for (const stockUpdate of stockUpdates) {
      await db.collection("products").updateOne(
        { _id: stockUpdate.productId, stock: { $gte: stockUpdate.quantity } },
        {
          $inc: { stock: -stockUpdate.quantity },
          $set: { updatedAt: now },
        },
      );
    }

    // Update categories
    // Aggregate by category to minimize DB calls
    const categoryStatsMap = {};
    for (const stat of categoryStatsUpdates) {
      const catIdStr = stat.categoryId.toString();
      if (!categoryStatsMap[catIdStr]) {
        categoryStatsMap[catIdStr] = { sales: 0, profit: 0, commission: 0, count: 0 };
      }
      categoryStatsMap[catIdStr].sales += stat.sales;
      categoryStatsMap[catIdStr].profit += stat.profit;
      categoryStatsMap[catIdStr].commission += stat.commission;
      categoryStatsMap[catIdStr].count += 1;
    }

    for (const [catId, stats] of Object.entries(categoryStatsMap)) {
      await db.collection("categories").updateOne(
        { _id: new ObjectId(catId) },
        {
          $inc: {
            totalSales: stats.sales,
            totalProfit: stats.profit,
            totalCommission: stats.commission,
            saleCount: stats.count,
          },
          $set: { updatedAt: now },
        },
      );
    }

    // =========================================================
    // ✅ 12. Success Response
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
