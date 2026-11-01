import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

function getRange(dateFilter, startStr, endStr) {
  const today = getBDToday();
  const todayStr = fmtBDDate(today.y, today.m, today.d);
  switch (dateFilter) {
    case "today": return { start: bdStart(todayStr), end: bdEnd(todayStr) };
    case "yesterday": {
      const y = new Date(Date.UTC(today.y, today.m, today.d - 1));
      const s = fmtBDDate(y.getUTCFullYear(), y.getUTCMonth(), y.getUTCDate());
      return { start: bdStart(s), end: bdEnd(s) };
    }
    case "week": {
      const cur = new Date(Date.UTC(today.y, today.m, today.d));
      const dow = cur.getUTCDay();
      const daysBack = (dow + 1) % 7;
      const ws = new Date(cur); ws.setUTCDate(ws.getUTCDate() - daysBack);
      const we = new Date(ws); we.setUTCDate(we.getUTCDate() + 6);
      return {
        start: bdStart(fmtBDDate(ws.getUTCFullYear(), ws.getUTCMonth(), ws.getUTCDate())),
        end: bdEnd(fmtBDDate(we.getUTCFullYear(), we.getUTCMonth(), we.getUTCDate())),
      };
    }
    case "month": {
      const s = fmtBDDate(today.y, today.m, 1);
      const eD = new Date(Date.UTC(today.y, today.m + 1, 0));
      return { start: bdStart(s), end: bdEnd(fmtBDDate(eD.getUTCFullYear(), eD.getUTCMonth(), eD.getUTCDate())) };
    }
    case "last-month": {
      const s = new Date(Date.UTC(today.y, today.m - 1, 1));
      const e = new Date(Date.UTC(today.y, today.m, 0));
      return {
        start: bdStart(fmtBDDate(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())),
        end: bdEnd(fmtBDDate(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())),
      };
    }
    case "last-10-days": {
      const cur = new Date(Date.UTC(today.y, today.m, today.d));
      const past = new Date(cur); past.setUTCDate(past.getUTCDate() - 10);
      return {
        start: bdStart(fmtBDDate(past.getUTCFullYear(), past.getUTCMonth(), past.getUTCDate())),
        end: bdEnd(todayStr),
      };
    }
    case "year": return { start: bdStart(fmtBDDate(today.y, 0, 1)), end: bdEnd(fmtBDDate(today.y, 11, 31)) };
    case "all": return { start: null, end: null };
    case "custom":
      if (!startStr || !endStr) return { error: "custom dates required" };
      const s = bdStart(startStr); const e = bdEnd(endStr);
      if (!s || !e) return { error: "invalid custom dates" };
      if (s > e) return { error: "start > end" };
      return { start: s, end: e };
    default: return { start: null, end: null };
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipientId");
    const dateFilter = searchParams.get("dateFilter") || "all";
    const customStartDate = searchParams.get("customStartDate");
    const customEndDate = searchParams.get("customEndDate");

    const client = await clientPromise;
    const db = client.db("products");

    const range = getRange(dateFilter, customStartDate, customEndDate);
    if (range.error) return NextResponse.json({ success: false, message: range.error }, { status: 400 });

    let query = {};
    if (range.start && range.end) query.createdAt = { $gte: range.start, $lte: range.end };
    if (recipientId) query.recipientId = recipientId;

    const payouts = await db.collection("commissionPayouts").find(query).sort({ createdAt: -1 }).toArray();

    const authDb = client.db("auth");
    const employees = await authDb.collection("credentials").find({ role: "employee", status: true }).toArray();
    const empMap = {};
    for (const e of employees) empMap[e._id.toString()] = e;

    return NextResponse.json({
      success: true,
      data: payouts.map((p) => ({
        _id: p._id,
        receiptNumber: p.receiptNumber || "",
        amount: Number(p.amount || 0),
        paymentMethod: p.paymentMethod || "Cash",
        paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
        transactionReference: p.transactionReference || "",
        note: p.note || "",
        recipient: empMap[p.recipientId?.toString()]?.name || `Employee ${p.recipientId}`,
        recipientId: p.recipientId,
        recipientEmail: empMap[p.recipientId?.toString()]?.email || "",
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("COMMISSION PAYOUT LIST ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load payout history" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, amount, paymentMethod, transactionReference, note, dateRange } = body;

    if (!recipientId || !amount) {
      return NextResponse.json({ success: false, message: "recipientId and amount required" }, { status: 400 });
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      return NextResponse.json({ success: false, message: "Invalid amount" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    // Verify recipient exists and is employee
    const authDb = client.db("auth");
    const employee = await authDb.collection("credentials").findOne({ _id: new ObjectId(recipientId), role: "employee", status: true });
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    // Generate receipt number: RCP-YYYYMMDD-XXXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateKey = `${year}${month}${day}`;
    const counterResult = await db.collection("counters").findOneAndUpdate(
      { _id: `commission_rcpt_${dateKey}` },
      { $inc: { sequence: 1 }, $set: { updatedAt: now } },
      { upsert: true, returnDocument: "after" }
    );
    if (!counterResult) throw new Error("Failed to generate receipt counter");
    const receiptNumber = `RCP-${dateKey}-${String(counterResult.sequence).padStart(5, "0")}`;

    const payoutDoc = {
      recipientId: recipientId.toString(),
      amount: amt,
      paymentMethod: paymentMethod || "Cash",
      transactionReference: transactionReference || "",
      note: note || "",
      receiptNumber,
      dateRange: dateRange || undefined,
      createdAt: now,
    };

    const result = await db.collection("commissionPayouts").insertOne(payoutDoc);

    return NextResponse.json({ success: true, data: { receiptNumber, payoutId: result.insertedId.toString() } });
  } catch (error) {
    console.error("COMMISSION PAYOUT POST ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to record payout" }, { status: 500 });
  }
}
