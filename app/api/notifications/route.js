import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// =========================================================
// GET - Fetch notifications for current user
// =========================================================

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 20;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const query = { userId: session.user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await db
      .collection("notifications")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get unread count
    const unreadCount = await db
      .collection("notifications")
      .countDocuments({ userId: session.user.id, isRead: false });

    return NextResponse.json({
      success: true,
      data: notifications.map((n) => ({
        ...n,
        _id: n._id.toString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST - Create new notification (internal use)
// =========================================================

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const body = await request.json();
    const { userId, type, title, message, link, metadata } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const notification = {
      userId,
      type, // 'sale', 'expense', 'employee', 'system', 'alert'
      title,
      message,
      link: link || null,
      metadata: metadata || {},
      isRead: false,
      createdAt: new Date(),
    };

    const result = await db.collection("notifications").insertOne(notification);

    return NextResponse.json({
      success: true,
      data: { ...notification, _id: result.insertedId.toString() },
    }, { status: 201 });
  } catch (error) {
    console.error("CREATE NOTIFICATION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create notification" },
      { status: 500 }
    );
  }
}
