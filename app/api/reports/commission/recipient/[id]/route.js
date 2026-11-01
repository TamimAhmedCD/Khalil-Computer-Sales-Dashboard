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

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const recipientId = resolvedParams?.id || new URL(request.url).searchParams.get("recipientId");

    if (!recipientId) {
      return NextResponse.json({ success: false, message: "recipientId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get("dateFilter") || "all";
    const customStartDate = searchParams.get("customStartDate");
    const customEndDate = searchParams.get("customEndDate");

    const client = await clientPromise;
    const authDb = client.db("auth");
    const db = client.db("products");

    const employee = await authDb.collection("credentials").findOne({ _id: new ObjectId(recipientId), role: "employee", status: true });
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    const range = getRange(dateFilter, customStartDate, customEndDate);
    if (range.error) return NextResponse.json({ success: false, message: range.error }, { status: 400 });

    const salesQuery = { sellerId: recipientId };
    if (range.start && range.end) {
      salesQuery.createdAt = { $gte: range.start, $lte: range.end };
    }

    const allSales = await db.collection("sales").find({ sellerId: recipientId }).sort({ createdAt: -1 }).toArray();
    const filteredSales = await db.collection("sales").find(salesQuery).sort({ createdAt: -1 }).toArray();
    const payouts = await db.collection("commissionPayouts").find({ recipientId: recipientId }).sort({ createdAt: -1 }).toArray();

    const totalSalesAll = allSales.reduce((sum, s) => sum + Number(s.totalPrice || s.total || 0), 0);
    const totalCommissionEarnedAll = allSales.reduce((sum, s) => sum + Number(s.commission || 0), 0);
    const totalCommissionPaid = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remainingDue = Math.max(0, totalCommissionEarnedAll - totalCommissionPaid);

    const filteredCommissionEarned = filteredSales.reduce((sum, s) => sum + Number(s.commission || 0), 0);
    const filteredSalesTotal = filteredSales.reduce((sum, s) => sum + Number(s.totalPrice || s.total || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        recipient: {
          _id: employee._id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone || "",
          totalSales: totalSalesAll,
          totalCommissionEarned: totalCommissionEarnedAll,
          totalCommissionPaid,
          remaining: remainingDue,
          filteredSalesTotal,
          filteredCommissionEarned,
          orderCount: allSales.length,
          filteredOrderCount: filteredSales.length,
          payoutCount: payouts.length,
        },
        sales: filteredSales.map((s) => ({
          _id: s._id,
          invoiceNumber: s.invoiceNumber || `SALE-${s._id.toString().slice(-6)}`,
          customer: s.customerName || "Walk-in",
          total: Number(s.totalPrice || s.total || 0),
          commission: Number(s.commission || 0),
          commissionRate: Number(s.commissionRate || 0),
          date: s.createdAt ? new Date(s.createdAt).toISOString() : null,
        })),
        payouts: payouts.map((p) => ({
          _id: p._id,
          receiptNumber: p.receiptNumber || "",
          amount: Number(p.amount || 0),
          paymentMethod: p.paymentMethod || "Cash",
          paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
          reference: p.transactionReference || "",
          note: p.note || "",
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        })),
      },
    });
  } catch (error) {
    console.error("RECIPIENT DETAIL ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load recipient details" }, { status: 500 });
  }
}
