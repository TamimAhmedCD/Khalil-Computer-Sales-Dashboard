// =========================================================
// PDF Generator for Invoices using jsPDF & autoTable
// =========================================================

export async function generateInvoicePDF(invoice) {
  try {
    const jspdfMod = await import("jspdf");
    const jsPDF = jspdfMod.jsPDF || jspdfMod.default?.jsPDF || jspdfMod.default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Helper for currency formatting in PDF (avoid font encoding issues with unicode symbols)
    const formatMoney = (amount) => `Tk. ${Number(amount || 0).toLocaleString("en-BD")}`;

    // Date formatting
    const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt || new Date());
    const formattedDate = invoiceDate.toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // =========================================================
    // 1. BRAND HEADER & DEMO LOGO
    // =========================================================

    // Draw Logo Placeholder Badge
    const logoX = margin;
    const logoY = yPos;
    const logoSize = 14;

    // Blue rounded rect for logo
    doc.setFillColor(37, 99, 235); // #2563eb
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, "F");

    // "KC" Logo Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("KC", logoX + logoSize / 2, logoY + 9, { align: "center" });

    // Shop Info
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KHALIL COMPUTER", logoX + logoSize + 4, yPos + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text("Computer Sales & Service Center", logoX + logoSize + 4, yPos + 10.5);
    doc.text("Barlekha, Moulvibazar, Bangladesh | Phone: +880 1715 409109", logoX + logoSize + 4, yPos + 14.5);

    // Invoice Title & Meta on the Right
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INVOICE", pageWidth - margin, yPos + 6, { align: "right" });

    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(invoice.invoiceNumber || "INV-00000", pageWidth - margin, yPos + 11, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Date: ${formattedDate}`, pageWidth - margin, yPos + 15, { align: "right" });

    // Top Accent Divider
    yPos += 20;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // =========================================================
    // 2. CUSTOMER & INVOICE DETAILS
    // =========================================================
    yPos += 7;

    // Left Column: Bill To
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("BILL TO", margin, yPos);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(invoice.customerName || "Walk-in Customer", margin, yPos + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    let custY = yPos + 10;

    if (invoice.customerPhone) {
      doc.text(`Phone: ${invoice.customerPhone}`, margin, custY);
      custY += 4.5;
    }
    if (invoice.customerAddress) {
      doc.text(`Address: ${invoice.customerAddress}`, margin, custY);
      custY += 4.5;
    }

    // Right Column: Additional Details
    const rightColX = pageWidth / 2 + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("INVOICE DETAILS", rightColX, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(`Payment: ${invoice.paymentMethod || "Cash"}`, rightColX, yPos + 5.5);
    doc.text(`Created By: ${invoice.createdBy || "Staff"}`, rightColX, yPos + 10);

    yPos = Math.max(custY + 2, yPos + 16);

    // =========================================================
    // 3. ITEMS TABLE
    // =========================================================
    const tableColumn = ["#", "Item / Service", "Description", "Qty", "Unit Price", "Discount", "Total"];
    const tableRows = (invoice.items || []).map((item, index) => [
      (index + 1).toString(),
      item.name || "",
      item.description || "—",
      `${item.quantity || 1} ${item.unit || "pcs"}`,
      formatMoney(item.unitPrice),
      item.discount > 0 ? `-${formatMoney(item.discount)}` : "—",
      formatMoney(item.total),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      headStyles: {
        fillColor: [30, 41, 59], // #1e293b
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [55, 65, 81],
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // #f9fafb
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 45, fontStyle: "bold", textColor: [17, 24, 39] },
        2: { cellWidth: 45, textColor: [107, 114, 128] },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 18, halign: "right", textColor: [220, 38, 38] },
        6: { cellWidth: 22, halign: "right", fontStyle: "bold", textColor: [17, 24, 39] },
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        // Subtle bottom border on table rows
        if (data.section === "body") {
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.1);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // =========================================================
    // 4. TOTALS & SUMMARY
    // =========================================================
    const totalsWidth = 65;
    const totalsX = pageWidth - margin - totalsWidth;
    const rightValueX = pageWidth - margin;
    const rowHeight = 5.5;

    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text("Subtotal:", totalsX, yPos);
    doc.text(formatMoney(invoice.subtotal), rightValueX, yPos, { align: "right" });

    // Discount
    if (invoice.totalDiscount > 0) {
      yPos += rowHeight;
      doc.text("Total Discount:", totalsX, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatMoney(invoice.totalDiscount)}`, rightValueX, yPos, { align: "right" });
      doc.setTextColor(75, 85, 99);
    }

    // Separator line
    yPos += 3;
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.2);
    doc.line(totalsX, yPos, rightValueX, yPos);
    yPos += 4;

    // Grand Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text("Grand Total:", totalsX, yPos);
    doc.text(formatMoney(invoice.grandTotal), rightValueX, yPos, { align: "right" });

    // Paid Amount
    yPos += rowHeight + 1;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text("Paid Amount:", totalsX, yPos);
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(invoice.paidAmount), rightValueX, yPos, { align: "right" });

    // Due Amount
    yPos += rowHeight;
    doc.setFont("helvetica", "bold");
    const isDue = (invoice.dueAmount || 0) > 0;
    doc.setTextColor(isDue ? 220 : 22, isDue ? 38 : 163, isDue ? 38 : 74);
    doc.text("Due Amount:", totalsX, yPos);
    doc.text(formatMoney(invoice.dueAmount), rightValueX, yPos, { align: "right" });

    // Reset color
    doc.setTextColor(75, 85, 99);

    // =========================================================
    // 5. NOTES & STATUS BADGE
    // =========================================================
    const notesWidth = pageWidth / 2 - margin;
    let notesY = doc.lastAutoTable.finalY + 8;

    if (invoice.notes) {
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(margin, notesY, notesWidth, 20, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("NOTES / TERMS", margin + 3, notesY + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      const splitNotes = doc.splitTextToSize(invoice.notes, notesWidth - 6);
      doc.text(splitNotes, margin + 3, notesY + 9);
    }

    // Status Stamp (PAID or DUE)
    const stampY = Math.max(yPos + 12, notesY + 25);
    const stampText = isDue ? `DUE: ${formatMoney(invoice.dueAmount)}` : "PAID IN FULL";

    doc.setDrawColor(isDue ? 220 : 22, isDue ? 38 : 163, isDue ? 38 : 74);
    doc.setLineWidth(0.6);
    doc.roundedRect(pageWidth / 2 - 25, stampY - 4, 50, 8, 1.5, 1.5, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(isDue ? 220 : 22, isDue ? 38 : 163, isDue ? 38 : 74);
    doc.text(stampText, pageWidth / 2, stampY + 1.5, { align: "center" });

    // =========================================================
    // 6. FOOTER
    // =========================================================
    const footerY = pageHeight - 12;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Thank you for your business! | Terms & Conditions apply", margin, footerY);
    doc.text(
      `Generated by Khalil Computer Management System • ${formattedDate}`,
      pageWidth - margin,
      footerY,
      { align: "right" }
    );

    // Save PDF
    const fileName = `Invoice_${invoice.invoiceNumber || "KC"}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return { success: false, error: error.message };
  }
}
