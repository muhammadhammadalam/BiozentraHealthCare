import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/logo.png";

export interface LineItem {
  id: string;
  product: string;
  qty: number;
  unitPrice: number;
}

interface OrderExport {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: string;
}

interface InvoiceExport {
  id: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface CompanyInfo {
  companyName: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  currency: string;
}

const SETTINGS_KEY = "biozentra-settings";

function loadCompanyInfo(): CompanyInfo {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const s = JSON.parse(stored);
      return {
        companyName: s.companyName || "BIOZENTRA Healthcare",
        address:     s.address    || "S-990, Block I, Saadi Garden, CDA Scheme 33, Karachi",
        city:        s.city       || "Karachi",
        country:     s.country    || "Pakistan",
        email:       s.email      || "info@biozentra.pk",
        phone:       s.phone      || "+92 321 9221901",
        currency:    s.currency   || "PKR",
      };
    }
  } catch { /* ignore */ }
  return {
    companyName: "BIOZENTRA Healthcare",
    address:     "S-990, Block I, Saadi Garden, CDA Scheme 33, Karachi",
    city:        "Karachi",
    country:     "Pakistan",
    email:       "info@biozentra.pk",
    phone:       "+92 321 9221901",
    currency:    "PKR",
  };
}

// ── Load logo as base64 ──────────────────────────────────────────────────────
async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Letterhead: header + watermark ──────────────────────────────────────────
function drawLetterhead(doc: jsPDF, logoB64: string | null, company: CompanyInfo) {
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;

  // ── Top green accent bar (thin) ──
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, W, 3, "F");

  // ── Logo top-left ──
  if (logoB64) {
    try { doc.addImage(logoB64, "PNG", 12, 6, 16, 16); } catch { /* skip if error */ }
  }

  // ── Company name ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.text("BIOZENTRA", 31, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text("HEALTHCARE", 31, 19);

  // ── Faded watermark logo (centre-right of page) ──
  if (logoB64) {
    try {
      // Draw a very light logo in the center of the page
      doc.saveGraphicsState();
      // Use a low global alpha approximation by drawing a white rectangle over (workaround)
      // Actually we'll place image then overlay a white semi-transparent rect
      doc.addImage(logoB64, "PNG", W * 0.3, H * 0.2, W * 0.55, H * 0.55);
      // White overlay to fade it
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.91 }));
      doc.rect(W * 0.3, H * 0.2, W * 0.55, H * 0.55, "F");
      doc.restoreGraphicsState();
    } catch { /* skip watermark if error */ }
  }

  // ── Separator line under header ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(12, 26, W - 12, 26);
}

// ── Green footer bar ─────────────────────────────────────────────────────────
function drawLetterheadFooter(doc: jsPDF, company: CompanyInfo) {
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  const barH = 14;
  const barY = H - barH;

  doc.setFillColor(22, 101, 52);
  doc.rect(0, barY, W, barH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  const phone   = company.phone   || "+92 321 9221901";
  const email   = company.email   || "info@biozentra.pk";
  const website = "www.biozentra.pk";
  const address = [company.address, company.city, company.country].filter(Boolean).join(", ");

  // Evenly space across the footer bar
  const items = [
    `✆  ${phone}`,
    `✉  ${email}`,
    `⊕  ${website}`,
    `⌂  ${address}`,
  ];
  const colW = W / items.length;
  items.forEach((text, i) => {
    doc.text(text, colW * i + colW / 2, barY + 9, { align: "center" });
  });
}

// ── Page number footer (above the green bar) ──────────────────────────────────
function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(160);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 17,
      { align: "center" }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────────────────────

export const exportOrdersToPDF = async (orders: OrderExport[]) => {
  const company  = loadCompanyInfo();
  const logoB64  = await loadLogoBase64();
  const doc      = new jsPDF();
  const curr     = company.currency || "PKR";
  const W        = doc.internal.pageSize.width;

  drawLetterhead(doc, logoB64, company);

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text("Orders Report", W / 2, 36, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PK")}`, W / 2, 43, { align: "center" });

  autoTable(doc, {
    startY: 50,
    head: [["Order ID", "Customer", "Date", "Items", `Total (${curr})`, "Status"]],
    body: orders.map((o) => [o.id, o.customer, o.date, o.items.toString(), o.total.toLocaleString(), o.status]),
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { fontSize: 9, cellPadding: 4 },
    margin: { bottom: 22 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const s = data.cell.raw as string;
        if (s === "Delivered") data.cell.styles.textColor = [22, 101, 52];
        else if (s === "Pending") data.cell.styles.textColor = [161, 98, 7];
        else if (s === "Cancelled") data.cell.styles.textColor = [185, 28, 28];
      }
    },
  });

  addPageNumbers(doc);
  // Draw footer on every page
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    drawLetterheadFooter(doc, company);
  }
  doc.save(`biozentra-orders-${new Date().toISOString().split("T")[0]}.pdf`);
};

export const exportInvoicesToPDF = async (invoices: InvoiceExport[]) => {
  const company  = loadCompanyInfo();
  const logoB64  = await loadLogoBase64();
  const doc      = new jsPDF();
  const curr     = company.currency || "PKR";
  const W        = doc.internal.pageSize.width;

  drawLetterhead(doc, logoB64, company);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text("Invoices Report", W / 2, 36, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PK")}`, W / 2, 43, { align: "center" });

  const totalAmt   = invoices.reduce((s, i) => s + i.amount, 0);
  const paidAmt    = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const pendingAmt = invoices.filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0);

  doc.setFontSize(9); doc.setTextColor(30);
  doc.text(`Total: ${curr} ${totalAmt.toLocaleString()}`, 14, 52);
  doc.text(`Paid: ${curr} ${paidAmt.toLocaleString()}`, 80, 52);
  doc.text(`Pending: ${curr} ${pendingAmt.toLocaleString()}`, 146, 52);

  autoTable(doc, {
    startY: 60,
    head: [["Invoice ID", "Customer", "Date", "Due Date", `Amount (${curr})`, "Status"]],
    body: invoices.map((inv) => [inv.id, inv.customer, inv.date, inv.dueDate, inv.amount.toLocaleString(), inv.status]),
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { fontSize: 9, cellPadding: 4 },
    margin: { bottom: 22 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const s = data.cell.raw as string;
        if (s === "Paid") data.cell.styles.textColor = [22, 101, 52];
        else if (s === "Overdue") data.cell.styles.textColor = [185, 28, 28];
        else if (s === "Pending") data.cell.styles.textColor = [161, 98, 7];
      }
    },
  });

  addPageNumbers(doc);
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    drawLetterheadFooter(doc, company);
  }
  doc.save(`biozentra-invoices-${new Date().toISOString().split("T")[0]}.pdf`);
};

export const exportSingleInvoicePDF = async (
  invoice: InvoiceExport,
  lineItems?: LineItem[],
  discountPct?: number
) => {
  const company  = loadCompanyInfo();
  const logoB64  = await loadLogoBase64();
  const doc      = new jsPDF();
  const curr     = company.currency || "PKR";
  const W        = doc.internal.pageSize.width;

  drawLetterhead(doc, logoB64, company);

  // ── Invoice label ─────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(22, 101, 52);
  doc.text("INVOICE", W - 14, 15, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(invoice.id, W - 14, 22, { align: "right" });

  // ── Bill To + details box ─────────────────────────────────────────────────
  const y0 = 34;

  doc.setFontSize(7.5);
  doc.setTextColor(130);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 14, y0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text(invoice.customer, 14, y0 + 8);

  // Details box (right)
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(W - 78, y0 - 2, 64, 32, 2, 2, "F");
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(110);
  const bx = W - 74;
  doc.text("Invoice No:",  bx, y0 + 5);
  doc.text("Issue Date:", bx, y0 + 13);
  doc.text("Due Date:",   bx, y0 + 21);
  doc.setFont("helvetica", "bold"); doc.setTextColor(20);
  doc.text(invoice.id,    bx + 22, y0 + 5);
  doc.text(invoice.date,  bx + 22, y0 + 13);
  doc.text(invoice.dueDate, bx + 22, y0 + 21);

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    Paid: [22, 101, 52], Pending: [161, 98, 7], Overdue: [185, 28, 28],
  };
  const col = statusColors[invoice.status] || [80, 80, 80];
  doc.setFillColor(...col);
  doc.roundedRect(14, y0 + 12, 26, 8, 1.5, 1.5, "F");
  doc.setFontSize(7); doc.setTextColor(255); doc.setFont("helvetica", "bold");
  doc.text(invoice.status.toUpperCase(), 27, y0 + 17.5, { align: "center" });

  // ── Line items table ───────────────────────────────────────────────────────
  const tableY = y0 + 40;

  if (lineItems && lineItems.length > 0) {
    autoTable(doc, {
      startY: tableY,
      head: [["#", "Item / Product", "Qty", `Unit Price (${curr})`, `Total (${curr})`]],
      body: lineItems.map((item, i) => [
        (i + 1).toString(),
        item.product,
        item.qty.toString(),
        item.unitPrice.toLocaleString(),
        (item.qty * item.unitPrice).toLocaleString(),
      ]),
      headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 9, cellPadding: 3.5 },
      margin: { bottom: 30 },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "right", cellWidth: 38 },
        4: { halign: "right", cellWidth: 38 },
      },
    });
  }

  // ── Totals box ────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTable = (doc as any).lastAutoTable?.finalY ?? tableY + 20;
  let ty = afterTable + 6;

  // Calculate amounts
  const subtotal    = lineItems ? lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0) : invoice.amount;
  const pct         = discountPct || 0;
  const discountAmt = subtotal * pct / 100;
  const totalAmt    = invoice.amount; // already discounted by caller

  const boxX = W - 82;
  const boxW = 68;

  doc.setFillColor(248, 252, 248);
  doc.setDrawColor(200, 230, 210);
  doc.setLineWidth(0.3);

  // Subtotal row
  doc.rect(boxX, ty, boxW, 8, "FD");
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
  doc.text("Subtotal", boxX + 4, ty + 5.5);
  doc.setTextColor(20);
  doc.text(`${curr} ${subtotal.toLocaleString()}`, boxX + boxW - 4, ty + 5.5, { align: "right" });
  ty += 8;

  // Discount row (only if there's a discount)
  if (pct > 0) {
    doc.setFillColor(255, 248, 248);
    doc.rect(boxX, ty, boxW, 8, "FD");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 40, 40);
    doc.text(`Discount (${pct}%)`, boxX + 4, ty + 5.5);
    doc.text(`− ${curr} ${discountAmt.toLocaleString()}`, boxX + boxW - 4, ty + 5.5, { align: "right" });
    ty += 8;
  }

  // Total row
  doc.setFillColor(22, 101, 52);
  doc.rect(boxX, ty, boxW, 12, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 255, 200);
  doc.text("TOTAL DUE", boxX + 4, ty + 7);
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255);
  doc.text(`${curr} ${totalAmt.toLocaleString()}`, boxX + boxW - 4, ty + 8, { align: "right" });

  // ── Footer ─────────────────────────────────────────────────────────────────
  const pH = doc.internal.pageSize.height;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(120);
  doc.text("Thank you for your business!", 14, pH - 20);

  drawLetterheadFooter(doc, company);
  doc.save(`${invoice.id}.pdf`);
};
