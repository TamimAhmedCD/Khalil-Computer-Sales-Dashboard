import clientPromise from "@/lib/mongodb";

/**
 * Server-side notification helper.
 * Call this from API routes to push notifications to specific users.
 *
 * @param {Object} options
 * @param {string} options.userId   - Target user ID (or "all-admins" to broadcast)
 * @param {string} options.type     - 'sale' | 'expense' | 'employee' | 'system' | 'alert'
 * @param {string} options.title    - Short title
 * @param {string} options.message  - Description
 * @param {string} [options.link]   - Optional deep-link URL
 * @param {Object} [options.metadata] - Extra data
 */
export async function createNotification({ userId, type, title, message, link, metadata }) {
  try {
    const client = await clientPromise;
    const db = client.db("products");

    // If "all-admins", find all admin and superAdmin user IDs
    let targetUserIds = [];

    if (userId === "all-admins") {
      const admins = await db
        .collection("users")
        .find({ role: { $in: ["admin", "superAdmin"] } })
        .project({ _id: 1 })
        .toArray();
      targetUserIds = admins.map((a) => a._id.toString());
    } else if (Array.isArray(userId)) {
      targetUserIds = userId;
    } else {
      targetUserIds = [userId];
    }

    const now = new Date();

    const notifications = targetUserIds.map((uid) => ({
      userId: uid,
      type: type || "system",
      title,
      message,
      link: link || null,
      metadata: metadata || {},
      isRead: false,
      createdAt: now,
    }));

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications);
    }

    return true;
  } catch (error) {
    // Notification failures should never block the main operation
    console.error("NOTIFY ERROR:", error?.message);
    return false;
  }
}
