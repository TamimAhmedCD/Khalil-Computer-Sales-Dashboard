import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// =========================================================
// PATCH - Mark notification as read
// =========================================================

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Handle "mark-all-read" special case
    if (id === "mark-all-read") {
      const client = await clientPromise;
      const db = client.db("products");

      await db.collection("notifications").updateMany(
        { userId: session.user.id, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    // Single notification mark as read
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid notification ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const result = await db.collection("notifications").updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: { isRead: true, readAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("UPDATE NOTIFICATION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE - Delete notification
// =========================================================

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Handle "clear-all" special case
    if (id === "clear-all") {
      const client = await clientPromise;
      const db = client.db("products");

      await db.collection("notifications").deleteMany({
        userId: session.user.id,
        isRead: true,
      });

      return NextResponse.json({
        success: true,
        message: "All read notifications cleared",
      });
    }

    // Single notification delete
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid notification ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const result = await db.collection("notifications").deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
