import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // 🔥 মঙ্গোডিবি ObjectId ইম্পোর্ট করলাম আইডি ভ্যালিডেশনের জন্য
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 🔐 ১. অথেন্টিকেশন ও সেশন চেক (ব্যাকএন্ডেই সিকিউরলি হ্যান্ডেলড)
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    let {
      invoiceNumber,
      customerName,
      customerPhone,
      productName,
      categoryId, // 🔄 ড্রপডাউন থেকে এখন ক্যাটাগরি নামের বদলে আইডি আসবে
      quantity,
      totalPrice,
      expenseCost,
      paymentMethod,
      paidAmount,
      note,
    } = body;

    // ✅ ভ্যালু ক্লিন এবং ট্রিম করা
    customerName = customerName?.trim() || "";
    customerPhone = customerPhone?.trim() || "";
    productName = productName?.trim();
    categoryId = categoryId?.trim();

    quantity = Number(quantity);
    totalPrice = Number(totalPrice);
    expenseCost = Number(expenseCost || 0);
    paidAmount = Number(paidAmount || 0);

    // ❌ ২. বেসিক রিকোয়ার্ড ফিল্ড ভ্যালিডেশন
    if (
      !invoiceNumber ||
      !productName ||
      !categoryId || // 🔄 category এর জায়গায় এখন categoryId চেক হবে
      !quantity ||
      !totalPrice
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Missing required fields (invoice, product, category ID, quantity, or price)",
        },
        { status: 400 },
      );
    }

    // 🛑 ডাটাবেজ কানেকশন ইনিশিয়ালাইজেশন (কোডের শুরুতেই রাখা হলো এরর এড়াতে)
    const client = await clientPromise;
    const db = client.db("products");

    // 🔍 ৩. ডুপ্লিকেট ইনভয়েস চেক
    const existingInvoice = await db.collection("sales").findOne({
      invoiceNumber,
    });

    if (existingInvoice) {
      return Response.json(
        { success: false, message: "Invoice already exists" },
        { status: 400 },
      );
    }

    // ❌ ৪. মাইনাস বা জিরো ভ্যালু প্রোটেকশন
    if (quantity <= 0 || totalPrice < 0 || expenseCost < 0 || paidAmount < 0) {
      return Response.json(
        {
          success: false,
          message: "Negative values or zero quantity are not allowed",
        },
        { status: 400 },
      );
    }

    // ❌ ৫. বিজনেস লজিক ভ্যালিডেশনস
    if (totalPrice < quantity) {
      return Response.json(
        {
          success: false,
          message: `Total price cannot be less than quantity (${quantity} pcs)`,
        },
        { status: 400 },
      );
    }

    if (expenseCost > totalPrice) {
      return Response.json(
        {
          success: false,
          message: "Expense cost cannot exceed the Total Price",
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

    // 🔍 ৬. ক্যাটাগরি আইডি ভ্যালিডেশন এবং ডাটা রিট্রিভ
    if (!ObjectId.isValid(categoryId)) {
      return Response.json(
        { success: false, message: "Invalid Category ID format" },
        { status: 400 },
      );
    }

    const categoryData = await db.collection("categories").findOne({
      _id: new ObjectId(categoryId), // 🔥 নাম বাদ দিয়ে আইডি দিয়ে খোঁজা হচ্ছে
    });

    if (!categoryData) {
      return Response.json(
        { success: false, message: "Category not found in database" },
        { status: 404 },
      );
    }

    // 🔥 7. কন্ডিশনাল কাস্টমার ভ্যালিডেশন (ডাটাবেজ থেকে রিয়েল-টাইম নাম ম্যাচিং)
    const mandatoryCategories = [
      "DCR",
      "Khajna Payment",
      "Namjari",
      "Khajna Nibondon",
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

    const commissionRate = categoryData.commission || 0;

    // 📊 ৮. ক্যালকুলেশনস
    const total = totalPrice;
    const rawExpense = expenseCost; // অন্যান্য মূল খরচ

    // ১. কমিশনের পরিমাণ বের করে পূর্ণসংখ্যা করা
    const commission = Math.round((total * commissionRate) / 100);

    // ২. মূল খরচ এবং কমিশন যোগ করে মোট খরচ (Total Expense) বের করা
    const totalExpense = rawExpense + commission;

    // ৩. মোট টাকা থেকে সব খরচ (কমিশনসহ) বাদ দিয়ে Net Profit বের করা
    const netProfit = Math.round(total - totalExpense);

    // ৪. কাস্টমার যদি শুধু প্রোডাক্টের দাম দিয়ে থাকে, তবে বাকি (Due) হিসাব:
    // [এখানে 'total' থেকে 'paidAmount' বাদ দেওয়া হয়েছে। যদি কমিশন কাস্টমারের কাছ থেকে আদায়যোগ্য বকেয়া হয়, তবে total এর জায়গায় (total + commission) হতে পারে। তবে সাধারণত due = total - paidAmount-ই হয়।]
    const due = Math.max(total - paidAmount, 0);

    // 💾 ৯. সেলস রেকর্ড ইনসার্ট (ভবিষ্যতের রিপোর্টের জন্য আইডি ও নাম দুটিই সেভ রাখছি)
    const sale = await db.collection("sales").insertOne({
      sellerName: session.user.name, // 🔐 সেশন থেকে নেওয়া সুরক্ষিত নাম
      sellerId: session.user.id, // 🔐 সেশন থেকে নেওয়া সুরক্ষিত আইডি
      customerName,
      invoiceNumber,
      customerPhone,
      productName,
      categoryId: new ObjectId(categoryId), // 🔄 ক্যাটাগরি রিলেশন আইডি
      categoryName: categoryData.name, // 🔄 ক্যাটাগরি স্ন্যাপশট নাম
      quantity,
      totalPrice,
      expenseCost,
      paymentMethod,
      paidAmount,
      note: note || "",

      total,
      totalExpense,
      netProfit,
      commission,
      due,

      createdAt: new Date(),
    });

    // 📈 ১০. ক্যাটাগরি স্ট্যাটস আপডেট (এখন ক্যাটাগরি আইডি দিয়ে সুরক্ষিতভাবে আপডেট হবে)
    await db.collection("categories").updateOne(
      { _id: new ObjectId(categoryId) }, // 🔥 নাম চেঞ্জ হলেও এই ট্র্যাকিং বিন্দুমাত্র নড়বে না
      {
        $inc: {
          totalSales: total,
          totalProfit: netProfit,
          totalCommission: commission,
          saleCount: 1,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
    );

    return Response.json({
      success: true,
      message: "Sale recorded successfully",
      saleId: sale.insertedId,
      data: {
        total,
        totalExpense,
        netProfit,
        commission,
        due,
      },
    });
  } catch (error) {
    console.error("SALE API ERROR:", error);
    return Response.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
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
