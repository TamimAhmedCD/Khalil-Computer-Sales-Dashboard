import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length < 2) {
      return Response.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const existing = await db.collection("expenseCategories").findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: new ObjectId(id) },
    });
    if (existing) {
      return Response.json({ success: false, message: "Category name already taken" }, { status: 409 });
    }

    await db.collection("expenseCategories").updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: name.trim(), description: description?.trim() || "", updatedAt: new Date() } },
    );

    return Response.json({ success: true, message: "Category updated" });
  } catch (error) {
    console.error("UPDATE EXPENSE CATEGORY ERROR:", error);
    return Response.json({ success: false, message: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ success: false, message: "Invalid ID format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const category = await db.collection("expenseCategories").findOne({ _id: new ObjectId(id) });
    if (!category) {
      return Response.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    const expensesUsingCategory = await db.collection("expenses").countDocuments({ categoryId: id });
    if (expensesUsingCategory > 0) {
      return Response.json(
        { success: false, message: "Cannot delete category: it is currently assigned to existing expenses." },
        { status: 400 },
      );
    }

    await db.collection("expenseCategories").deleteOne({ _id: new ObjectId(id) });

    return Response.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("DELETE EXPENSE CATEGORY ERROR:", error);
    return Response.json({ success: false, message: "Failed to delete category" }, { status: 500 });
  }
}
