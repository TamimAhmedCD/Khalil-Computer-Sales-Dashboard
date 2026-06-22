import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const session = await auth();
    const isAdmin =
      session?.user?.role === "admin" || session?.user?.role === "superAdmin";

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

// ==========================================
// ১. EDIT / UPDATE CATEGORY API (PATCH)
// URL: /api/categories?id=CATEGORY_ID
// ==========================================
export async function PATCH(req) {
  try {
    // 🔐 সেশন ও এডমিন রোল চেক
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 🔍 ইউআরএল থেকে আইডি রিড করা (?id=...)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Valid Category ID is required in query" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, commission, description, status } = body;

    const client = await clientPromise;
    const db = client.db("products");

    // ডায়নামিক আপডেটের জন্য অবজেক্ট তৈরি
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (commission !== undefined) updateData.commission = Number(commission);
    if (description !== undefined) updateData.description = description || "";
    if (status !== undefined) updateData.status = status;

    updateData.updatedAt = new Date();

    // 🔍 নাম এডিট করলে ডুপ্লিকেট চেক (নিজের আইডি বাদে অন্য কারও সাথে মিলছে কিনা)
    if (name) {
      const existingCategory = await db.collection("categories").findOne({
        name: name.trim(),
        _id: { $ne: new ObjectId(id) },
      });

      if (existingCategory) {
        return Response.json(
          { success: false, message: "Category name already exists" },
          { status: 400 },
        );
      }
    }

    // 💾 ডাটাবেজে আপডেট
    const result = await db.collection("categories").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }, // আপডেটেড ডাটা রিটার্ন করবে
    );

    if (!result) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Category updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("CATEGORY UPDATE ERROR:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to update category",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// ==========================================
// ২. DELETE CATEGORY API (DELETE)
// URL: /api/categories?id=CATEGORY_ID
// ==========================================
export async function DELETE(req) {
  try {
    // 🔐 সেশন ও এডমিন রোল চেক
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 🔍 ইউআরএল থেকে আইডি রিড করা (?id=...)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Valid Category ID is required in query" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    // 🛑 সেফটি চেক: এই ক্যাটাগরিতে অলরেডি কোনো সেলস (Sales) রেকর্ড আছে কিনা
    const hasSales = await db.collection("sales").findOne({
      categoryId: new ObjectId(id),
    });

    if (hasSales) {
      // যদি অলরেডি সেলস থাকে, ডাটাবেজ থেকে ডিলেট না করে ইন-অ্যাক্টিভ (Soft Delete) করে দেওয়া নিরাপদ
      await db
        .collection("categories")
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: false, updatedAt: new Date() } },
        );

      return Response.json({
        success: true,
        message:
          "Category contains active sales. It has been deactivated instead of deleted.",
        softDeleted: true,
      });
    }

    // যদি কোনো সেলস রেকর্ড না থাকে, সরাসরি ডাটাবেজ থেকে ডিলিট (Hard Delete)
    const result = await db.collection("categories").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Category deleted successfully from database",
      softDeleted: false,
    });
  } catch (error) {
    console.error("CATEGORY DELETE ERROR:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to delete category",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
