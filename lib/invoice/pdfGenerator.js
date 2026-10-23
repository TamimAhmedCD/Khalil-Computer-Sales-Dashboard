// =========================================================
// PDF Generator for Invoices using jsPDF & autoTable
// =========================================================

import QRCode from "qrcode";

const getLogoDataUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        console.error("Canvas SVG error:", e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

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
    // 1. BRAND HEADER & LOGO
    // =========================================================

    // Draw Logo
    const logoX = margin;
    const logoY = yPos;
    const logoSize = 23;

    const logoDataUrl = await getLogoDataUrl("/logo.svg");
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", logoX, logoY-2, logoSize, logoSize);
    } else {
      // Fallback: Blue rounded rect for logo
      doc.setFillColor(0, 62, 126); // #003E7E
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, "F");
      // "KC" Logo Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("KC", logoX + logoSize / 2, logoY + 11, { align: "center" });
    }

    // Shop Info
    doc.setTextColor(0, 62, 126);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KHALIL COMPUTER", logoX + logoSize + 4, yPos + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text("Reliable institution of technology, training and public service", logoX + logoSize + 4, yPos + 8.5);
    doc.text("Muktijoddha Complex, Barlekha, Moulvibazar, Bangladesh", logoX + logoSize + 4, yPos + 12.5);
    doc.text("Phone: +880 1715 409109", logoX + logoSize + 4, yPos + 16.5);
    doc.text("Website: khalilcomputer.com", logoX + logoSize + 4, yPos + 20.5);

    // Invoice Title & Meta on the Right
    doc.setTextColor(0, 62, 126); // #003E7E
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INVOICE", pageWidth - margin, yPos + 4.5, { align: "right" });

    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(invoice.invoiceNumber || "INV-00000", pageWidth - margin, yPos + 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Date: ${formattedDate}`, pageWidth - margin, yPos + 14.5, { align: "right" });

    // Top Accent Divider
    yPos += 26;
    doc.setDrawColor(0, 62, 126); // #003E7E
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // =========================================================
    // 2. CUSTOMER & INVOICE DETAILS
    // =========================================================
    yPos += 7;

    // Left Column: Bill To (left aligned)
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

    // Right Column: Additional Details (right aligned, margin right)
    const rightColX = pageWidth - margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("INVOICE DETAILS", rightColX, yPos, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(`Payment: ${invoice.paymentMethod || "Cash"}`, rightColX, yPos + 5.5, { align: "right" });
    doc.text(`Created By: ${invoice.createdBy || "Staff"}`, rightColX, yPos + 10, { align: "right" });

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
    // 6. QR CODE — Verification
    // =========================================================
    const qrY = stampY + 10;
    try {
      const verifyUrl = `https://khalilcomputer.com/verify/invoice/${invoice.invoiceNumber}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#003E7E", light: "#FFFFFF" },
      });

      // Dashed border top
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(pageWidth / 2 - 30, qrY, pageWidth / 2 + 30, qrY);

      // "Verify Invoice" label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text("VERIFY INVOICE", pageWidth / 2, qrY + 4, { align: "center" });

      // QR image
      const qrSize = 22;
      doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - qrSize / 2, qrY + 6, qrSize, qrSize);

      // URL text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Scan to verify: khalilcomputer.com/verify/invoice/${invoice.invoiceNumber}`,
        pageWidth / 2,
        qrY + 6 + qrSize + 3,
        { align: "center" }
      );

      // Dashed border bottom
      doc.line(pageWidth / 2 - 30, qrY + 6 + qrSize + 6, pageWidth / 2 + 30, qrY + 6 + qrSize + 6);

      // Reset dash pattern
      doc.setLineDashPattern([], 0);
    } catch (qrErr) {
      console.error("QR generation for PDF failed:", qrErr);
    }

    // =========================================================
    // 7. FOOTER
    // =========================================================
    const footerY = pageHeight - 12;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([], 0);
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

// =========================================================
// PDF Generator for Due Collection Receipt
// =========================================================

export async function generateReceiptPDF(receipt) {
  try {
    const jspdfMod = await import("jspdf");
    const jsPDF = jspdfMod.jsPDF || jspdfMod.default?.jsPDF || jspdfMod.default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    const formatMoney = (amount) => `Tk. ${Number(amount || 0).toLocaleString("en-BD")}`;

    const collectionDate = new Date(receipt.collectionDate || new Date());
    const formattedDate = collectionDate.toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // =========================================================
    // 1. BRAND HEADER & LOGO
    // =========================================================

    const logoDataUrl = await getLogoDataUrl("/logo.svg");
    if (logoDataUrl) {
      const logoX = margin;
      const logoY = yPos;
      const logoSize = 23;
      doc.addImage(logoDataUrl, "PNG", logoX, logoY - 2, logoSize, logoSize);
    }

    doc.setTextColor(0, 62, 126);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KHALIL COMPUTER", margin + (logoDataUrl ? 27 : 0), yPos + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text("Reliable institution of technology, training and public service", margin + (logoDataUrl ? 27 : 0), yPos + 8.5);
    doc.text("Muktijoddha Complex, Barlekha, Moulvibazar, Bangladesh", margin + (logoDataUrl ? 27 : 0), yPos + 12.5);
    doc.text("Phone: +880 1715 409109", margin + (logoDataUrl ? 27 : 0), yPos + 16.5);
    doc.text("Website: khalilcomputer.com", margin + (logoDataUrl ? 27 : 0), yPos + 20.5);

    // Receipt Title on the Right
    doc.setTextColor(0, 62, 126);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RECEIPT", pageWidth - margin, yPos + 4.5, { align: "right" });

    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(receipt.receiptNumber || "RCP-00000", pageWidth - margin, yPos + 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Date: ${formattedDate}`, pageWidth - margin, yPos + 14.5, { align: "right" });

    yPos += 26;
    doc.setDrawColor(0, 62, 126);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // =========================================================
    // 2. CUSTOMER & RECEIPT DETAILS
    // =========================================================
    yPos += 7;

    // Left Column: Customer
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("RECEIVED FROM", margin, yPos);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(receipt.customerName || "Unknown", margin, yPos + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    let custY = yPos + 10;

    if (receipt.customerPhone) {
      doc.text(`Phone: ${receipt.customerPhone}`, margin, custY);
      custY += 4.5;
    }

    // Right Column: Invoice & Receipt Info
    const rightColX = pageWidth - margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("RELATED INVOICE", rightColX, yPos, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(receipt.invoiceNumber || "N/A", rightColX, yPos + 5.5, { align: "right" });

    yPos = Math.max(custY + 2, yPos + 16);

    // =========================================================
    // 3. PAYMENT DETAILS TABLE
    // =========================================================
    const tableColumn = ["Description", "Amount"];
    const tableRows = [
      ["Collection Amount", formatMoney(receipt.collectionAmount)],
    ];

    if (receipt.collectionNote) {
      tableRows.push(["Note", receipt.collectionNote]);
    }

    tableRows.push(["Payment Method", receipt.paymentMethod || "Cash"]);
    tableRows.push(["Collected By", receipt.collectedBy || "Unknown"]);

    autoTable(doc, {
      startY: yPos,
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [55, 65, 81],
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: "bold" },
        1: { cellWidth: 50, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // =========================================================
    // 4. REMAINING DUE
    // =========================================================
    const isDue = (receipt.remainingDue || 0) > 0;
    const dueColor = isDue ? [220, 38, 38] : [22, 163, 74];
    const dueLabel = isDue ? "REMAINING DUE" : "PAID IN FULL";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(dueLabel, margin, yPos);
    doc.setTextColor(...dueColor);
    doc.text(formatMoney(receipt.remainingDue), pageWidth - margin, yPos, { align: "right" });

    yPos += 20;

    // =========================================================
    // 5. FOOTER
    // =========================================================
    const footerY = pageHeight - 12;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Thank you for your payment!", margin, footerY);
    doc.text(
      `Generated by Khalil Computer Management System • ${formattedDate}`,
      pageWidth - margin,
      footerY,
      { align: "right" }
    );

    // Save PDF
    const fileName = `Receipt_${receipt.receiptNumber || "KC"}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Receipt PDF Generation Error:", error);
    return { success: false, error: error.message };
  }
}
