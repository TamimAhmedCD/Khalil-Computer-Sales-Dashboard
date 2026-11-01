// =========================================================
// COMMISSION REPORTS / COMMISSION DASHBOARD API
// =========================================================
// Endpoints: /api/reports/commission/dashboard
// Uses existing employees only (credentials collection role=employee)
// Payouts live in commissionPayouts collection; sales carry commission field already.

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
    const dateFilter = searchParams.get("dateFilter") || "all";
    const customStartDate = searchParams.get("customStartDate");
    const customEndDate = searchParams.get("customEndDate");
    const recipientFilter = searchParams.get("recipient") || "all";

    const range = getRange(dateFilter, customStartDate, customEndDate);
    if (range.error) return NextResponse.json({ success: false, message: range.error }, { status: 400 });

    const client = await clientPromise;
    const authDb = client.db("auth");
    const db = client.db("products");

    const employees = await authDb.collection("credentials").find({ role: "employee", status: true }).toArray();

    const salesQuery = {};
    if (range.start && range.end) salesQuery.createdAt = { $gte: range.start, $lte: range.end };
    const sales = await db.collection("sales").find(salesQuery).toArray();

    const salesBySeller = {};
    for (const s of sales) {
      const sid = s.sellerId?.toString ? s.sellerId.toString() : s.sellerId || "unknown";
      if (!salesBySeller[sid]) salesBySeller[sid] = [];
      salesBySeller[sid].push(s);
    }

    const payoutsQuery = {};
    if (range.start && range.end) payoutsQuery.createdAt = { $gte: range.start, $lte: range.end };
    const payouts = await db.collection("commissionPayouts").find(payoutsQuery).toArray();

    const payoutsBySeller = {};
    for (const p of payouts) {
      const sid = p.recipientId?.toString ? p.recipientId.toString() : p.recipientId || "unknown";
      if (!payoutsBySeller[sid]) payoutsBySeller[sid] = [];
      payoutsBySeller[sid].push(p);
    }

    let recipients = employees.map((emp) => {
      const sid = emp._id.toString();
      const empSales = salesBySeller[sid] || [];
      const totalSales = empSales.reduce((sum, s) => sum + Number(s.totalPrice || s.total || 0), 0);
      const totalCommissionEarned = empSales.reduce((sum, s) => sum + Number(s.commission || 0), 0);

      const empPayouts = payoutsBySeller[sid] || [];
      const totalPaid = empPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const lastPayoutTime = empPayouts.length
        ? Math.max(...empPayouts.map(p => new Date(p.createdAt || p.paymentDate || 0).getTime()))
        : null;
      const lastPayout = lastPayoutTime ? new Date(lastPayoutTime).toISOString() : null;

      return {
        _id: sid,
        name: emp.name || "Unknown",
        email: emp.email || "",
        role: emp.role || "employee",
        employeeId: emp._id?.toString?.() || sid,
        totalOrders: empSales.length,
        totalSales,
        totalCommissionEarned,
        totalCommissionPaid: totalPaid,
        remaining: Math.max(0, totalCommissionEarned - totalPaid),
        lastPaymentDate: lastPayout,
        payoutCount: empPayouts.length,
      };
    }).filter((r) => recipientFilter === "all" || (recipientFilter && r.name.toLowerCase().includes(recipientFilter.toLowerCase())));

    const summary = {
      totalCommissionEarned: recipients.reduce((sum, r) => sum + r.totalCommissionEarned, 0),
      totalCommissionPaid: recipients.reduce((sum, r) => sum + r.totalCommissionPaid, 0),
      totalOutstandingDue: recipients.reduce((sum, r) => sum + r.remaining, 0),
      totalRecipients: recipients.length,
      commissionPaidToday: 0,
      commissionPaidYesterday: 0,
      totalOrders: recipients.reduce((sum, r) => sum + r.totalOrders, 0),
    };

    // Today & Yesterday paid
    const today = getBDToday();
    const todayStr = fmtBDDate(today.y, today.m, today.d);
    const yesterday = new Date(Date.UTC(today.y, today.m, today.d - 1));
    const yesterdayStr = fmtBDDate(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate());
    const todayStart = bdStart(todayStr);
    const todayEnd = bdEnd(todayStr);
    const yesterdayStart = bdStart(yesterdayStr);
    const yesterdayEnd = bdEnd(yesterdayStr);
    const todayPayouts = await db.collection("commissionPayouts").find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).toArray();
    const yesterdayPayouts = await db.collection("commissionPayouts").find({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }).toArray();
    summary.commissionPaidToday = todayPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    summary.commissionPaidYesterday = yesterdayPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Recipient summaries (per employee)
    const recipientsSummary = recipients.map(r => ({ ...r }));

    // Ledger: recent paid-out commission records (per sale)
    const recentLedger = await db.collection("sales")
      .aggregate([
        { $match: { commission: { $gt: 0 } } },
        { $lookup: {
          from: "commissionPayouts",
          let: { sid: "$sellerId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$recipientId", "$$sid"] } } },
            { $group: {
              _id: "$_id",
              paidAmount: { $sum: "$amount" },
              paidDate: { $first: "$createdAt" },
              invoiceNumber: { $first: "$invoiceNumber" },
              customer: { $first: "$customerName" },
              saleDate: { $first: "$createdAt" }
            }}
          ],
          as: "payoutsMatch"
        }},
      ]).toArray();

    const ledger = recentLedger.map((row) => ({
      _id: row.paidAmount && row._id ? row._id : undefined,
      invoiceNumber: row.invoiceNumber || "",
      date: row.saleDate ? new Date(row.saleDate).toISOString() : "",
      customer: row.customer || "Walk-in",
      recipient: String(row._id || "").slice(-20) || "-",
      recipientId: "",
      saleAmount: 0,
      commissionEarned: Number(row.total || 0),
      commissionPaid: Number(row.paidAmount || 0),
      status: row.paidAmount >= Number(row.total || 0) ? "Paid" : "Partially Paid",
    }));

    return NextResponse.json({ success: true, data: { summary, recipients: recipientsSummary, ledger } });
  } catch (error) {
    console.error("COMMISSION DASHBOARD ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load commission data" }, { status: 500 });
  }
}
