import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

const BD_OFFSET = 6 * 60 * 60 * 1000;

function getBDToday() {
  const bd = new Date(Date.now() + BD_OFFSET);
  return { y: bd.getUTCFullYear(), m: bd.getUTCMonth(), d: bd.getUTCDate() };
}
function fmtBDDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function bdStart(dateString) {
  const d = new Date(`${dateString}T00:00:00+06:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function bdEnd(dateString) {
  const d = new Date(`${dateString}T23:59:59.999+06:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    // All sales with due > 0 or let's aggregate total outstanding due
    const sales = await db.collection("sales").find({ due: { $gt: 0 } }).toArray();

    // Also we need to subtract total collected in dueCollections per sale if any, or compute accurately.
    // Let's get all dueCollections to compute accurate remaining dues.
    const collections = await db.collection("dueCollections").find({}).toArray();
    const collectedBySale = {};
    for (const c of collections) {
      const sid = c.saleId?.toString();
      if (sid) {
        collectedBySale[sid] = (collectedBySale[sid] || 0) + Number(c.collectionAmount || 0);
      }
    }

    let totalOutstandingDue = 0;
    const customerPhonesWithDue = new Set();

    for (const s of sales) {
      const sid = s._id.toString();
      const originalDue = Number(s.due || 0);
      const collected = collectedBySale[sid] || 0;
      const remaining = Math.max(0, originalDue - collected);
      if (remaining > 0) {
        totalOutstandingDue += remaining;
        if (s.customerPhone) {
          customerPhonesWithDue.add(s.customerPhone.trim());
        }
      }
    }

    const today = getBDToday();
    const todayStr = fmtBDDate(today.y, today.m, today.d);
    const todayStart = bdStart(todayStr);
    const todayEnd = bdEnd(todayStr);

    const monthStartStr = fmtBDDate(today.y, today.m, 1);
    const monthStart = bdStart(monthStartStr);
    const monthEnd = bdEnd(todayStr);

    const todayCollections = await db.collection("dueCollections").find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }).toArray();

    const monthCollections = await db.collection("dueCollections").find({
      createdAt: { $gte: monthStart, $lte: monthEnd }
    }).toArray();

    const collectedToday = todayCollections.reduce((sum, c) => sum + Number(c.collectionAmount || 0), 0);
    const collectedThisMonth = monthCollections.reduce((sum, c) => sum + Number(c.collectionAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalOutstandingDue,
        collectedToday,
        collectedThisMonth,
        customersWithDue: customerPhonesWithDue.size,
      },
    });
  } catch (error) {
    console.error("DUE DASHBOARD ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load due dashboard" }, { status: 500 });
  }
}
