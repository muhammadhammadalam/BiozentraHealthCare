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
const GREY_LIGHT:  [number, number, number] = [248, 249, 250];
const GREY_MED:    [number, number, number] = [200, 210, 205];
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

// ── Single Invoice PDF (industrial quality) ───────────────────────────────────
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

  // ── Top green header bar ───────────────────────────────────────────────────
  doc.setFillColor(...GREEN_DARK);
  doc.rect(0, 0, W, 38, "F");

  // Logo in header
  if (logoB64) {
    try { doc.addImage(logoB64, "PNG", 10, 6, 22, 22); } catch { /* skip */ }
  }

  // Company name (white on green)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("BIOZENTRA", 36, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 230, 200);
  doc.text("HEALTHCARE MANAGEMENT", 36, 24);
  doc.setFontSize(7);
  doc.setTextColor(160, 210, 185);
  doc.text(`${company.phone}  |  ${company.email}`, 36, 31);

  // INVOICE label (right side of header)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", W - 12, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 220, 185);
  doc.text(invoice.id, W - 12, 27, { align: "right" });

  // ── Info section (Bill To + Invoice Details) ───────────────────────────────
  const infoY = 44;

  // Left: Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text("BILL TO", 12, infoY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text(invoice.customer, 12, infoY + 9);

  // Status badge under customer name
  const statusColors: Record<string, [number,number,number]> = {
    Paid: GREEN_MED, Pending: [161, 98, 7], Overdue: [185, 28, 28],
  };
  const sBg = statusColors[invoice.status] || [80, 80, 80];
  doc.setFillColor(...sBg);
  doc.roundedRect(12, infoY + 13, 28, 7, 1.5, 1.5, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text(invoice.status.toUpperCase(), 26, infoY + 17.5, { align: "center" });

  // Right: Invoice details box
  const bx = W - 76;
  const bw = 64;
  doc.setFillColor(...GREY_LIGHT);
  doc.setDrawColor(...GREY_MED);
  doc.setLineWidth(0.3);
  doc.roundedRect(bx, infoY - 2, bw, 32, 2, 2, "FD");

  const rows = [
    ["Invoice No.", invoice.id],
    ["Issue Date",  invoice.date],
    ["Due Date",   invoice.dueDate],
    ["Payment",    "30 days net"],
  ];
  rows.forEach(([label, val], idx) => {
    const ry = infoY + 5 + idx * 7;
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_LIGHT);
    doc.text(label, bx + 4, ry);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
    doc.text(val, bx + bw - 4, ry, { align: "right" });
  });

  // ── Divider ────────────────────────────────────────────────────────────────
  const divY = infoY + 34;
  doc.setDrawColor(...GREY_MED);
  doc.setLineWidth(0.3);
  doc.line(12, divY, W - 12, divY);

  // ── Line items table ───────────────────────────────────────────────────────
  const tableStartY = divY + 4;

  if (lineItems && lineItems.length > 0) {
    autoTable(doc, {
      startY: tableStartY,
      head: [["Sr.", "Description / Product", "Qty", `Unit Price (${curr})`, `Amount (${curr})`]],
      body: lineItems.map((item, i) => [
        (i + 1).toString(),
        item.product,
        item.qty.toString(),
        item.unitPrice.toLocaleString(),
        (item.qty * item.unitPrice).toLocaleString(),
      ]),
      headStyles: {
        fillColor: GREEN_MED,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: GREEN_LIGHT },
      styles: {
        fontSize: 9.5,
        cellPadding: { top: 4.5, bottom: 4.5, left: 4, right: 4 },
        lineColor: GREY_MED,
        lineWidth: 0.2,
        textColor: TEXT_DARK,
      },
      margin: { left: 12, right: 12, bottom: 55 },
      columnStyles: {
        0: { halign: "center", cellWidth: 12, fontStyle: "bold" },
        2: { halign: "center", cellWidth: 16 },
        3: { halign: "right",  cellWidth: 40 },
        4: { halign: "right",  cellWidth: 40, fontStyle: "bold" },
      },
    });
  } else {
    // No line items — just show amount box directly
    autoTable(doc, {
      startY: tableStartY,
      head: [["Description", `Amount (${curr})`]],
      body: [["Invoice amount", invoice.amount.toLocaleString()]],
      headStyles: { fillColor: GREEN_MED, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9.5, cellPadding: 5, lineColor: GREY_MED, lineWidth: 0.2 },
      margin: { left: 12, right: 12, bottom: 55 },
    });
  }

  // ── Totals block ───────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTable = (doc as any).lastAutoTable?.finalY ?? tableStartY + 20;

  const subtotal    = lineItems ? lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0) : invoice.amount;
  const pct         = discountPct ?? invoice.discountPct ?? 0;
  const discountAmt = Math.round(subtotal * pct / 100);
  const totalDue    = invoice.amount; // already net of discount

  const boxX = W - 88;
  const boxW = 76;
  let ty = afterTable + 6;

  // Subtotal
  doc.setFillColor(...GREY_LIGHT);
  doc.setDrawColor(...GREY_MED);
  doc.setLineWidth(0.2);
  doc.rect(boxX, ty, boxW, 9, "FD");
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MID);
  doc.text("Subtotal", boxX + 5, ty + 6);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(`${curr} ${subtotal.toLocaleString()}`, boxX + boxW - 5, ty + 6, { align: "right" });
  ty += 9;

  // Discount row (only if applicable)
  if (pct > 0) {
    doc.setFillColor(255, 244, 244);
    doc.rect(boxX, ty, boxW, 9, "FD");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(185, 28, 28);
    doc.text(`Discount (${pct}%)`, boxX + 5, ty + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${curr} ${discountAmt.toLocaleString()}`, boxX + boxW - 5, ty + 6, { align: "right" });
    ty += 9;
  }

  // Tax row (0% — shown for transparency)
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(boxX, ty, boxW, 9, "FD");
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MID);
  doc.text("Tax (0%)", boxX + 5, ty + 6);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(`${curr} 0`, boxX + boxW - 5, ty + 6, { align: "right" });
  ty += 9;

  // Total due — green bar
  doc.setFillColor(...GREEN_MED);
  doc.roundedRect(boxX, ty, boxW, 14, 1.5, 1.5, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 230, 200);
  doc.text("TOTAL DUE", boxX + 5, ty + 6);
  doc.setFontSize(11.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text(`${curr} ${totalDue.toLocaleString()}`, boxX + boxW - 5, ty + 10, { align: "right" });
  ty += 14;

  // ── Notes / Payment terms ──────────────────────────────────────────────────
  const notesY = Math.max(ty + 10, afterTable + 6);

  doc.setFillColor(...GREEN_LIGHT);
  doc.setDrawColor(...GREY_MED);
  doc.setLineWidth(0.2);
  doc.roundedRect(12, notesY, 88, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...GREEN_DARK);
  doc.text("PAYMENT TERMS & NOTES", 16, notesY + 6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_MID);
  const notes = [
    "• Payment due within 30 days of invoice date.",
    "• Late payments may incur a 2% monthly service charge.",
    "• For queries: info@biozentra.pk | +92 321 9221901",
    "• Please reference the invoice number in all payments.",
  ];
  notes.forEach((line, i) => {
    doc.text(line, 16, notesY + 13 + i * 4.5);
  });

  // ── Thank you strip ────────────────────────────────────────────────────────
  const tyY = H - 30;
  doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...TEXT_MID);
  doc.text("Thank you for your business with Biozentra Healthcare.", W / 2, tyY, { align: "center" });

  // ── Footer ─────────────────────────────────────────────────────────────────
  drawLetterheadFooter(doc, company);

  doc.save(`${invoice.id}.pdf`);
};
