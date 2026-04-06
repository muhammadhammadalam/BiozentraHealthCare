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
  discountPct?: number;
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

// ── Colours ──────────────────────────────────────────────────────────────────
const GREEN_DARK:  [number, number, number] = [15, 82, 40];
const GREEN_MED:   [number, number, number] = [22, 101, 52];
const GREEN_LIGHT: [number, number, number] = [220, 252, 231];
const NAVY_BLUE:   [number, number, number] = [28, 52, 120];
const BLUE_LIGHT:  [number, number, number] = [219, 229, 255];
const GREY_LIGHT:  [number, number, number] = [248, 249, 250];
const GREY_MED:    [number, number, number] = [200, 210, 205];
const GREY_LINE:   [number, number, number] = [220, 220, 220];
const TEXT_DARK:   [number, number, number] = [20,  24,  28];
const TEXT_MID:    [number, number, number] = [80,  90,  95];
const TEXT_LIGHT:  [number, number, number] = [140, 150, 155];

// ── Letterhead (shared) ───────────────────────────────────────────────────────
function drawLetterhead(doc: jsPDF, logoB64: string | null, company: CompanyInfo) {
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;

  // Faint watermark
  if (logoB64) {
    try {
      doc.addImage(logoB64, "PNG", W * 0.25, H * 0.20, W * 0.55, H * 0.55);
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.93 }));
      doc.rect(W * 0.25, H * 0.20, W * 0.55, H * 0.55, "F");
      doc.setGState(doc.GState({ opacity: 1 }));
    } catch { /* skip */ }
  }

  // Top accent bar
  doc.setFillColor(...GREEN_DARK);
  doc.rect(0, 0, W, 4, "F");

  // Logo
  if (logoB64) {
    try { doc.addImage(logoB64, "PNG", 12, 8, 18, 18); } catch { /* skip */ }
  }

  // Company name block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GREEN_MED);
  doc.text("BIOZENTRA", 33, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MID);
  doc.text("HEALTHCARE MANAGEMENT", 33, 22);

  // Contact top-right
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(`${company.phone}  |  ${company.email}  |  www.biozentra.pk`, W - 14, 14, { align: "right" });
  doc.text(`${company.address}, ${company.city}`, W - 14, 20, { align: "right" });

  // Divider
  doc.setDrawColor(...GREY_MED);
  doc.setLineWidth(0.4);
  doc.line(12, 30, W - 12, 30);
}

// ── Footer ────────────────────────────────────────────────────────────────────
function drawLetterheadFooter(doc: jsPDF, company: CompanyInfo) {
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  const barH = 14;
  const barY = H - barH;

  doc.setFillColor(...GREEN_DARK);
  doc.rect(0, barY, W, barH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  const phone   = company.phone   || "+92 321 9221901";
  const email   = company.email   || "info@biozentra.pk";
  const address = [company.address, company.city].filter(Boolean).join(", ") || "Karachi, Pakistan";

  const items = [`Tel: ${phone}`, `Email: ${email}`, `Web: www.biozentra.pk`, address];
  const colW = W / items.length;
  items.forEach((text, i) => {
    doc.text(text, colW * i + colW / 2, barY + 9, { align: "center" });
  });
}

// ── Page numbers ──────────────────────────────────────────────────────────────
function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_LIGHT);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 17,
      { align: "center" }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const exportOrdersToPDF = async (orders: OrderExport[]) => {
  const company = loadCompanyInfo();
  const logoB64 = await loadLogoBase64();
  const doc     = new jsPDF();
  const curr    = company.currency || "PKR";
  const W       = doc.internal.pageSize.width;

  drawLetterhead(doc, logoB64, company);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...TEXT_DARK);
  doc.text("ORDERS REPORT", W / 2, 42, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PK")}   |   Total records: ${orders.length}`, W / 2, 49, { align: "center" });

  autoTable(doc, {
    startY: 56,
    head: [["Order ID", "Customer", "Date", "Items", `Total (${curr})`, "Status"]],
    body: orders.map((o) => [o.id, o.customer, o.date, o.items.toString(), o.total.toLocaleString(), o.status]),
    headStyles: { fillColor: GREEN_MED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    styles: { fontSize: 9, cellPadding: 4.5, lineColor: GREY_MED, lineWidth: 0.2 },
    margin: { left: 12, right: 12, bottom: 22 },
    columnStyles: {
      0: { fontStyle: "bold" },
      4: { halign: "right" },
      5: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const s = data.cell.raw as string;
        if (s === "Delivered") data.cell.styles.textColor = GREEN_MED;
        else if (s === "Pending") data.cell.styles.textColor = [161, 98, 7];
        else if (s === "Cancelled") data.cell.styles.textColor = [185, 28, 28];
      }
    },
  });

  addPageNumbers(doc);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); drawLetterheadFooter(doc, company); }
  doc.save(`biozentra-orders-${new Date().toISOString().split("T")[0]}.pdf`);
};

export const exportInvoicesToPDF = async (invoices: InvoiceExport[]) => {
  const company = loadCompanyInfo();
  const logoB64 = await loadLogoBase64();
  const doc     = new jsPDF();
  const curr    = company.currency || "PKR";
  const W       = doc.internal.pageSize.width;

  drawLetterhead(doc, logoB64, company);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...TEXT_DARK);
  doc.text("INVOICES REPORT", W / 2, 42, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PK")}   |   Total records: ${invoices.length}`, W / 2, 49, { align: "center" });

  const totalAmt   = invoices.reduce((s, i) => s + i.amount, 0);
  const paidAmt    = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const pendingAmt = invoices.filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0);

  // Summary pills
  const summaryY = 53;
  const pillData = [
    { label: "Total", value: `${curr} ${totalAmt.toLocaleString()}`, bg: GREEN_MED as [number,number,number], fg: [255,255,255] as [number,number,number] },
    { label: "Paid", value: `${curr} ${paidAmt.toLocaleString()}`, bg: [34,120,60] as [number,number,number], fg: [255,255,255] as [number,number,number] },
    { label: "Pending", value: `${curr} ${pendingAmt.toLocaleString()}`, bg: [161,98,7] as [number,number,number], fg: [255,255,255] as [number,number,number] },
  ];
  pillData.forEach((p, i) => {
    const px = 14 + i * 60;
    doc.setFillColor(...p.bg);
    doc.roundedRect(px, summaryY, 54, 10, 2, 2, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...p.fg);
    doc.text(p.label, px + 4, summaryY + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text(p.value, px + 50, summaryY + 7, { align: "right" });
  });

  autoTable(doc, {
    startY: 68,
    head: [["Invoice ID", "Customer", "Issue Date", "Due Date", `Amount (${curr})`, "Status"]],
    body: invoices.map((inv) => [inv.id, inv.customer, inv.date, inv.dueDate, inv.amount.toLocaleString(), inv.status]),
    headStyles: { fillColor: GREEN_MED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    styles: { fontSize: 9, cellPadding: 4.5, lineColor: GREY_MED, lineWidth: 0.2 },
    margin: { left: 12, right: 12, bottom: 22 },
    columnStyles: {
      0: { fontStyle: "bold" },
      4: { halign: "right" },
      5: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const s = data.cell.raw as string;
        if (s === "Paid") data.cell.styles.textColor = GREEN_MED;
        else if (s === "Overdue") data.cell.styles.textColor = [185, 28, 28];
        else if (s === "Pending") data.cell.styles.textColor = [161, 98, 7];
      }
    },
  });

  addPageNumbers(doc);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); drawLetterheadFooter(doc, company); }
  doc.save(`biozentra-invoices-${new Date().toISOString().split("T")[0]}.pdf`);
};

// ── Single Invoice PDF — Sample Layout ───────────────────────────────────────
export const exportSingleInvoicePDF = async (
  invoice: InvoiceExport,
  lineItems?: LineItem[],
  discountPct?: number
) => {
  const company = loadCompanyInfo();
  const logoB64 = await loadLogoBase64();
  const doc     = new jsPDF({ unit: "mm", format: "a4" });
  const curr    = company.currency || "PKR";
  const W       = doc.internal.pageSize.width;
  const H       = doc.internal.pageSize.height;

  // ── Watermark ─────────────────────────────────────────────────────────────
  if (logoB64) {
    try {
      doc.addImage(logoB64, "PNG", W * 0.22, H * 0.22, W * 0.56, H * 0.52);
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.93 }));
      doc.rect(W * 0.22, H * 0.22, W * 0.56, H * 0.52, "F");
      doc.setGState(doc.GState({ opacity: 1 }));
    } catch { /* skip */ }
  }

  // ── Keep the Biozentra letterhead ──────────────────────────────────────────
  drawLetterhead(doc, logoB64, company);

  // ── Invoice metadata box (below letterhead) ────────────────────────────────
  const metaY  = 35;
  const leftW  = (W - 24) / 2;   // half width minus margins
  const rightX = 12 + leftW + 4;

  // Left meta box: Invoice#, Date, Terms, Due Date
  doc.setDrawColor(...GREY_LINE);
  doc.setLineWidth(0.3);
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(12, metaY, leftW, 32, "FD");

  const metaRows: [string, string][] = [
    ["Invoice #",     invoice.id],
    ["Invoice Date",  invoice.date],
    ["Terms",         "Due on Receipt"],
    ["Due Date",      invoice.dueDate],
  ];
  metaRows.forEach(([label, val], i) => {
    const ry = metaY + 6 + i * 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...TEXT_LIGHT);
    doc.text(label, 16, ry);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
    doc.text(val, 12 + leftW - 4, ry, { align: "right" });
  });

  // Right: Ship To box
  doc.setDrawColor(...GREY_LINE);
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(rightX, metaY, leftW, 32, "FD");

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...TEXT_LIGHT);
  doc.text("SHIP TO", rightX + 4, metaY + 6);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MID); doc.setFontSize(8.5);
  doc.text(invoice.customer, rightX + 4, metaY + 13);
  doc.text(company.address || "", rightX + 4, metaY + 20);
  doc.text(`${company.city || ""}, ${company.country || ""}`, rightX + 4, metaY + 27);

  // ── Bill To / Ship To section ──────────────────────────────────────────────
  const billY = metaY + 37;

  // Bill To header — navy left column
  doc.setFillColor(...NAVY_BLUE);
  doc.rect(12, billY, leftW, 8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
  doc.text("Bill To", 16, billY + 5.5);

  // Ship To header — navy right column
  doc.setFillColor(...NAVY_BLUE);
  doc.rect(rightX, billY, leftW, 8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
  doc.text("Ship To", rightX + 4, billY + 5.5);

  // Bill To content
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...GREY_LINE);
  doc.rect(12, billY + 8, leftW, 20, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...TEXT_DARK);
  doc.text(invoice.customer, 16, billY + 15);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...TEXT_MID);
  doc.text(company.address || "", 16, billY + 22);

  // Ship To content
  doc.setFillColor(255, 255, 255);
  doc.rect(rightX, billY + 8, leftW, 20, "FD");
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...TEXT_MID);
  doc.text(company.address || "", rightX + 4, billY + 15);
  doc.text(`${company.city || ""}, ${company.country || ""}`, rightX + 4, billY + 22);

  // ── Line items table ───────────────────────────────────────────────────────
  const tableStartY = billY + 33;

  const subtotal    = lineItems && lineItems.length > 0
    ? lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    : invoice.amount;
  const pct         = discountPct ?? invoice.discountPct ?? 0;
  const discountAmt = Math.round(subtotal * pct / 100);
  const totalDue    = invoice.amount; // already net of discount

  if (lineItems && lineItems.length > 0) {
    autoTable(doc, {
      startY: tableStartY,
      head: [["#", "Item & Description", "Qty", "Rate", "Amount"]],
      body: lineItems.map((item, i) => [
        (i + 1).toString(),
        item.product,
        item.qty.toFixed(2),
        `${curr} ${item.unitPrice.toLocaleString()}`,
        `${item.qty > 1 ? "" : ""}${(item.qty * item.unitPrice).toLocaleString()}`,
      ]),
      headStyles: {
        fillColor: NAVY_BLUE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      styles: {
        fontSize: 9,
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        lineColor: GREY_LINE,
        lineWidth: 0.2,
        textColor: TEXT_DARK,
      },
      margin: { left: 12, right: 12, bottom: 60 },
      columnStyles: {
        0: { halign: "center", cellWidth: 12, fontStyle: "bold" },
        1: { cellWidth: "auto" },
        2: { halign: "right",  cellWidth: 20 },
        3: { halign: "right",  cellWidth: 38 },
        4: { halign: "right",  cellWidth: 38, fontStyle: "bold" },
      },
    });
  } else {
    autoTable(doc, {
      startY: tableStartY,
      head: [["#", "Item & Description", "Qty", "Rate", "Amount"]],
      body: [["1", "Invoice amount", "1.00", `${curr} ${invoice.amount.toLocaleString()}`, `${invoice.amount.toLocaleString()}`]],
      headStyles: { fillColor: NAVY_BLUE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 5, lineColor: GREY_LINE, lineWidth: 0.2 },
      margin: { left: 12, right: 12, bottom: 60 },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        2: { halign: "right", cellWidth: 20 },
        3: { halign: "right", cellWidth: 38 },
        4: { halign: "right", cellWidth: 38 },
      },
    });
  }

  // ── Sub Total row (right-aligned, just below the table) ────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTable = (doc as any).lastAutoTable?.finalY ?? tableStartY + 20;

  // Sub Total line
  doc.setDrawColor(...GREY_LINE);
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...TEXT_DARK);
  doc.text("Sub Total", W - 60, afterTable + 7);
  doc.text(`${curr} ${subtotal.toLocaleString()}`, W - 12, afterTable + 7, { align: "right" });

  // ── Bottom section: Thanks + T&C (left) and Totals (right) ─────────────────
  const bottomY  = afterTable + 14;
  const rightBoxX = W - 88;
  const rightBoxW = 76;

  // Totals box (right side) — light blue background
  let ty = bottomY;

  // DIS % row (or Tax Rate relabeled)
  doc.setFillColor(...BLUE_LIGHT);
  doc.setDrawColor(...GREY_LINE);
  doc.setLineWidth(0.2);
  doc.rect(rightBoxX, ty, rightBoxW, 9, "FD");
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...NAVY_BLUE);
  doc.text("DIS %", rightBoxX + 5, ty + 6);
  doc.setFont("helvetica", "bold");
  doc.text(`${pct.toFixed(2)}%`, rightBoxX + rightBoxW - 5, ty + 6, { align: "right" });
  ty += 9;

  // Total row
  doc.setFillColor(...BLUE_LIGHT);
  doc.rect(rightBoxX, ty, rightBoxW, 10, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...TEXT_DARK);
  doc.text("Total", rightBoxX + 5, ty + 7);
  doc.text(`${curr} ${totalDue.toLocaleString()}`, rightBoxX + rightBoxW - 5, ty + 7, { align: "right" });
  ty += 10;

  // Balance Due row (darker)
  doc.setFillColor(...NAVY_BLUE);
  doc.rect(rightBoxX, ty, rightBoxW, 11, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
  doc.text("Balance Due", rightBoxX + 5, ty + 7.5);
  doc.text(`${curr} ${totalDue.toLocaleString()}`, rightBoxX + rightBoxW - 5, ty + 7.5, { align: "right" });
  ty += 11;

  // ── Stamp / Signature (right side, below totals) ───────────────────────────
  const sigY = ty + 16;
  doc.setDrawColor(...TEXT_DARK);
  doc.setLineWidth(0.5);
  doc.line(rightBoxX, sigY, rightBoxX + rightBoxW, sigY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...TEXT_DARK);
  doc.text("STAMP / SIGNATURE", rightBoxX + rightBoxW / 2, sigY + 6, { align: "center" });

  // ── Thanks + Terms & Conditions (left side) ────────────────────────────────
  const leftTextX = 12;
  const leftTextMaxW = rightBoxX - leftTextX - 8;

  doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...TEXT_MID);
  doc.text("Thanks for shopping with us.", leftTextX, bottomY + 7);

  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...TEXT_DARK);
  doc.text("Terms & Conditions", leftTextX, bottomY + 17);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...TEXT_MID);
  const terms = doc.splitTextToSize(
    "Full payment is due upon receipt of this invoice. Late payments may incur additional charges or interest as per the applicable laws.",
    leftTextMaxW
  );
  doc.text(terms, leftTextX, bottomY + 24);

  // ── Footer ─────────────────────────────────────────────────────────────────
  drawLetterheadFooter(doc, company);

  doc.save(`${invoice.id}.pdf`);
};

// ── Comprehensive Report PDF ──────────────────────────────────────────────────
export interface ReportData {
  orders: Array<{ id: string; customer: string; date: string; total: number; status: string; products: string }>;
  invoices: Array<{ id: string; customer: string; date: string; amount: number; status: string }>;
  expenses: Array<{ id: string; date: string; category: string; description: string; amount: number }>;
  period: string;   // e.g. "January 2026" or "Annual 2026"
  isAnnual: boolean;
}

export const exportComprehensiveReportPDF = async (data: ReportData) => {
  const company = loadCompanyInfo();
  const logoB64 = await loadLogoBase64();
  const doc     = new jsPDF();
  const curr    = company.currency || "PKR";
  const W       = doc.internal.pageSize.width;

  const fmt = (v: number) => `${curr} ${v.toLocaleString()}`;

  // ──────────────────────────────────────────────────────────────── PAGE 1 ──
  drawLetterhead(doc, logoB64, company);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_DARK);
  doc.text("BUSINESS SUMMARY REPORT", W / 2, 42, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(`Period: ${data.period}   |   Generated: ${new Date().toLocaleDateString("en-PK")}`, W / 2, 50, { align: "center" });

  // Summary KPI pills
  const totalRevenue  = data.invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalOrders   = data.orders.length;
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit     = totalRevenue - totalExpenses;

  const pills = [
    { label: "Total Revenue",  value: fmt(totalRevenue),  bg: GREEN_MED  as [number,number,number] },
    { label: "Total Orders",   value: totalOrders.toString(), bg: NAVY_BLUE  as [number,number,number] },
    { label: "Total Expenses", value: fmt(totalExpenses), bg: [161,98,7]  as [number,number,number] },
    { label: "Net Profit",     value: fmt(netProfit),     bg: netProfit >= 0 ? [34,120,60] as [number,number,number] : [185,28,28] as [number,number,number] },
  ];

  const pillW = (W - 28) / 4;
  pills.forEach((p, i) => {
    const px = 12 + i * (pillW + 1.5);
    doc.setFillColor(...p.bg);
    doc.roundedRect(px, 56, pillW, 18, 2, 2, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(200, 230, 215);
    doc.text(p.label, px + 4, 63);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(255, 255, 255);
    doc.text(p.value, px + pillW - 4, 71, { align: "right" });
  });

  // ── Orders section ─────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GREEN_DARK);
  doc.text("ORDERS", 12, 84);
  doc.setDrawColor(...GREEN_MED);
  doc.setLineWidth(0.5);
  doc.line(12, 86, W - 12, 86);

  autoTable(doc, {
    startY: 89,
    head: [["Order ID", "Customer", "Products", "Date", `Total (${curr})`, "Status"]],
    body: data.orders.length > 0
      ? data.orders.map(o => [
          o.id, o.customer,
          o.products.length > 28 ? o.products.substring(0, 28) + "…" : o.products,
          o.date, o.total.toLocaleString(), o.status
        ])
      : [["—", "No orders found for this period", "", "", "", ""]],
    headStyles: { fillColor: GREEN_MED, textColor: [255,255,255], fontStyle: "bold", fontSize: 8.5, cellPadding: 4 },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: GREY_MED, lineWidth: 0.2 },
    margin: { left: 12, right: 12, bottom: 22 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32 },
      2: { cellWidth: 42 },
      4: { halign: "right" },
      5: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const s = data.cell.raw as string;
        if (s === "Delivered") data.cell.styles.textColor = GREEN_MED;
        else if (s === "Pending") data.cell.styles.textColor = [161, 98, 7];
      }
    },
  });

  // Order totals summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let curY = (doc as any).lastAutoTable?.finalY ?? 140;
  const deliveredTotal = data.orders.filter(o => o.status === "Delivered").reduce((s, o) => s + o.total, 0);
  const pendingTotal   = data.orders.filter(o => o.status === "Pending").reduce((s, o) => s + o.total, 0);

  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MID);
  doc.text(`Delivered: ${fmt(deliveredTotal)}   Pending: ${fmt(pendingTotal)}   Total: ${fmt(data.orders.reduce((s,o) => s+o.total, 0))}`, W - 12, curY + 5, { align: "right" });

  // ── Invoices section ───────────────────────────────────────────────────────
  curY += 12;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...GREEN_DARK);
  doc.text("INVOICES", 12, curY);
  doc.setDrawColor(...GREEN_MED); doc.setLineWidth(0.5);
  doc.line(12, curY + 2, W - 12, curY + 2);

  autoTable(doc, {
    startY: curY + 5,
    head: [["Invoice ID", "Customer", "Date", `Amount (${curr})`, "Status"]],
    body: data.invoices.length > 0
      ? data.invoices.map(i => [i.id, i.customer, i.date, i.amount.toLocaleString(), i.status])
      : [["—", "No invoices found for this period", "", "", ""]],
    headStyles: { fillColor: GREEN_MED, textColor: [255,255,255], fontStyle: "bold", fontSize: 8.5, cellPadding: 4 },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: GREY_MED, lineWidth: 0.2 },
    margin: { left: 12, right: 12, bottom: 22 },
    columnStyles: {
      0: { fontStyle: "bold" },
      3: { halign: "right" },
      4: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const s = data.cell.raw as string;
        if (s === "Paid") data.cell.styles.textColor = GREEN_MED;
        else if (s === "Overdue") data.cell.styles.textColor = [185, 28, 28];
        else if (s === "Pending") data.cell.styles.textColor = [161, 98, 7];
      }
    },
  });

  // ── New page for Expenses ──────────────────────────────────────────────────
  doc.addPage();
  drawLetterhead(doc, logoB64, company);

  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...GREEN_DARK);
  doc.text("OPERATING EXPENSES", 12, 40);
  doc.setDrawColor(...GREEN_MED); doc.setLineWidth(0.5);
  doc.line(12, 42, W - 12, 42);

  autoTable(doc, {
    startY: 45,
    head: [["Expense ID", "Date", "Category", "Description", `Amount (${curr})`]],
    body: data.expenses.length > 0
      ? data.expenses.map(e => [
          e.id, e.date, e.category,
          e.description.length > 35 ? e.description.substring(0, 35) + "…" : e.description,
          e.amount.toLocaleString()
        ])
      : [["—", "No expenses found for this period", "", "", ""]],
    headStyles: { fillColor: GREEN_MED, textColor: [255,255,255], fontStyle: "bold", fontSize: 8.5, cellPadding: 4 },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: GREY_MED, lineWidth: 0.2 },
    margin: { left: 12, right: 12, bottom: 22 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      4: { halign: "right" },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expTableEnd = (doc as any).lastAutoTable?.finalY ?? 140;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(`Total Expenses: ${fmt(totalExpenses)}`, W - 12, expTableEnd + 5, { align: "right" });

  // ── P&L Summary ────────────────────────────────────────────────────────────
  const plY = expTableEnd + 16;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...GREEN_DARK);
  doc.text("PROFIT & LOSS SUMMARY", 12, plY);
  doc.setDrawColor(...GREEN_MED); doc.setLineWidth(0.5);
  doc.line(12, plY + 2, W - 12, plY + 2);

  const plData: [string, string, [number,number,number]][] = [
    ["Revenue (Paid Invoices)", fmt(totalRevenue), GREEN_MED],
    ["Operating Expenses",      fmt(totalExpenses), [161,98,7]],
    ["Net Profit / (Loss)",     fmt(netProfit), netProfit >= 0 ? [34,120,60] : [185,28,28]],
  ];

  let plRowY = plY + 10;
  plData.forEach(([label, value, color]) => {
    doc.setFillColor(...(label.includes("Net") ? (netProfit >= 0 ? GREEN_LIGHT : [255,235,235] as [number,number,number]) : GREY_LIGHT));
    doc.setDrawColor(...GREY_LINE);
    doc.setLineWidth(0.2);
    doc.rect(12, plRowY, W - 24, 10, "FD");
    doc.setFont("helvetica", label.includes("Net") ? "bold" : "normal");
    doc.setFontSize(9.5); doc.setTextColor(...TEXT_DARK);
    doc.text(label, 16, plRowY + 7);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
    doc.text(value, W - 16, plRowY + 7, { align: "right" });
    plRowY += 10;
  });

  // Page numbers + footer on all pages
  addPageNumbers(doc);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); drawLetterheadFooter(doc, company); }

  const fileName = `biozentra-report-${data.period.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(fileName);
};
