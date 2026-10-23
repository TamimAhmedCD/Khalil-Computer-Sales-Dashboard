import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// =========================================================
// PUBLIC API: Invoice Verification
// No authentication required - anyone can verify invoices
// CORS enabled for khalilcomputer.com
// =========================================================

export async function GET(request, { params }) {
  // CORS headers - allow requests from khalilcomputer.com
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return NextResponse.json({}, { headers: corsHeaders });
  }

  try {
    const { invoiceNumber } = await params;

    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: "Invoice number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await clientPromise;
    const db = client.db("products");
    const invoicesCollection = db.collection("invoices");

    // Find the invoice by invoice number
    const sale = await invoicesCollection.findOne(
      { invoiceNumber },
      {
        projection: {
          invoiceNumber: 1,
          customerName: 1,
          customerPhone: 1,
          invoiceDate: 1,
          createdAt: 1,
          grandTotal: 1,
          paidAmount: 1,
          dueAmount: 1,
          paymentMethod: 1,
          items: 1,
          createdBy: 1,
        },
      }
    );

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Determine payment status
    const grandTotal = Number(sale.grandTotal) || 0;
    const paidAmount = Number(sale.paidAmount) || 0;
    const dueAmount = Number(sale.dueAmount) || grandTotal - paidAmount;
    const isPaid = dueAmount <= 0;

    // Format invoice date
    const invoiceDate = sale.invoiceDate || sale.createdAt;
    const formattedDate = invoiceDate
      ? new Date(invoiceDate).toLocaleDateString("en-BD", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

    // Return public invoice data (minimal, no sensitive info)
    const publicInvoiceData = {
      success: true,
      invoice: {
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName || "N/A",
        customerPhone: sale.customerPhone
          ? `***${sale.customerPhone.slice(-3)}`
          : null, // Masked for privacy
        invoiceDate: formattedDate,
        grandTotal,
        paidAmount,
        dueAmount,
        paymentMethod: sale.paymentMethod || "Cash",
        status: isPaid ? "PAID" : "DUE",
        itemCount: sale.items?.length || 0,
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Khalil Computer",
        shop: {
          name: "Khalil Computer",
          location: "Barlekha, Moulvibazar, Bangladesh",
          phone: "+880 1715 409109",
          website: "khalilcomputer.com",
        },
      },
    };

    return NextResponse.json(publicInvoiceData, { headers: corsHeaders });
  } catch (error) {
    console.error("Public invoice verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return NextResponse.json({}, { headers: corsHeaders });
}
