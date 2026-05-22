import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const body = await req.json();

    const { name, commission, description, status } = body;

    if (!name || commission === undefined) {
      return Response.json(
        { success: false, message: "Name and commission are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    const existingCategory = await db.collection("categories").findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return Response.json(
        { success: false, message: "Category already exists" },
        { status: 400 },
      );
    }

    // ✅ FIXED SCHEMA (aligned with sales API)
    const categoryData = {
      name: name.trim(),
      commission: Number(commission),
      description: description || "",
      status: status ?? true,

      // 🔥 IMPORTANT: match sales API
      totalSales: 0,
      totalProfit: 0,
      totalCommission: 0,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("categories").insertOne(categoryData);

    return Response.json({
      success: true,
      message: "Category created successfully",
      data: {
        _id: result.insertedId,
        ...categoryData,
      },
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      { success: false, message: "Failed to create category" },
      { status: 500 },
    );
  }
}
