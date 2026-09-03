import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    // 1. Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Database connection
    const client = await clientPromise;
    const db = client.db("products");

    // 3. Query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;
    const skip = (page - 1) * limit;

    // 4. Build query for active products only
    let query = { isActive: true };

    // Search by product name or brand
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && ObjectId.isValid(category)) {
      query.categoryId = new ObjectId(category);
    }

    // 5. Fetch products with pagination
    const products = await db
      .collection("products")
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // 6. Get total count for pagination
    const totalProducts = await db.collection("products").countDocuments(query);

    // 7. Fetch categories for dropdown
    const categories = await db
      .collection("categories")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // 8. Calculate summary stats
    const summaryData = await db.collection("products").aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$stock" },
          activeProducts: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
          totalValue: {
            $sum: {
              $multiply: ["$saleRate", "$stock"]
            }
          },
        },
      },
    ]).toArray();

    const summary = summaryData[0] || {
      totalStock: 0,
      activeProducts: 0,
      totalValue: 0,
    };

    // 9. Success response
    return Response.json({
      success: true,
      data: {
        products,
        categories,
        summary,
        pagination: {
          totalResults: totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
          currentPage: page,
          pageSize: limit,
        },
      },
    }, { status: 200 });

  } catch (error) {
    console.error("EMPLOYEE PRODUCTS API ERROR:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch products",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}