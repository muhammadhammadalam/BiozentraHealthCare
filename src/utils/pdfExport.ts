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
        address:     s.address    || "R-690, Block I, Saadi Garden, CDA Scheme 33, Karachi",
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
    address:     "R-690, Block I, Saadi Garden, CDA Scheme 33, Karachi",
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

// ── Single Invoice PDF — matches the exact uploaded Biozentra template ────────
export const exportSingleInvoicePDF = async (
  invoice: InvoiceExport,
  lineItems?: LineItem[],
  discountPct?: number
) => {
  const company = loadCompanyInfo();
  const logoB64 = await loadLogoBase64();
  const doc     = new jsPDF({ unit: "mm", format: "a4" });
  const curr    = company.currency || "PKR";
  const W       = doc.internal.pageSize.width;   // 210
  const H       = doc.internal.pageSize.height;  // 297
  const ML      = 14;
  const MR      = 14;
  const CW      = W - ML - MR; // 182

  // ── Template colours ──────────────────────────────────────────────────────
  const GRN:       [number,number,number] = [15, 100, 50];   // dark green bars
  const NAVY:      [number,number,number] = [30,  52, 110];  // table header navy
  const BLUE_BG:   [number,number,number] = [210, 218, 245]; // totals box blue
  const TXT_DARK:  [number,number,number] = [20,  24,  28];
  const TXT_GREY:  [number,number,number] = [130, 140, 150];
  const BORDER:    [number,number,number] = [190, 195, 205];

  // ════════════════════════════════════════════════════════════════════════
  // WATERMARK — two large faint logo impressions across the page
  // ════════════════════════════════════════════════════════════════════════
  if (logoB64) {
    try {
      doc.setGState(doc.GState({ opacity: 0.06 }));
      doc.addImage(logoB64, "PNG", W * 0.38, H * 0.08, W * 0.55, H * 0.52);
      doc.addImage(logoB64, "PNG", -8,       H * 0.44, W * 0.48, H * 0.38);
      doc.setGState(doc.GState({ opacity: 1 }));
    } catch { /* skip */ }
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 1 — TOP GREEN BAR: contact info in white text
  // ════════════════════════════════════════════════════════════════════════
  const TOP_H = 11;
  doc.setFillColor(...GRN);
  doc.rect(0, 0, W, TOP_H, "F");

  const phone = company.phone || "+92 321 9221901";
  const email = company.email || "info@biozentra.pk";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${phone}     ${email}     www.biozentra.pk`,
    W / 2, TOP_H * 0.68,
    { align: "center" }
  );

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 2 — WHITE HEADER: logo + "BIOZENTRA / HEALTHCARE"
  // ════════════════════════════════════════════════════════════════════════
  const HDR_H = 42;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, TOP_H, W, HDR_H, "F");

  const LOGO_SZ = 28;
  const LOGO_X  = ML;
  const LOGO_Y  = TOP_H + (HDR_H - LOGO_SZ) / 2;
  if (logoB64) {
    try { doc.addImage(logoB64, "PNG", LOGO_X, LOGO_Y, LOGO_SZ, LOGO_SZ); } catch { /* skip */ }
  }

  const TXT_X = LOGO_X + LOGO_SZ + 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 82, 40);
  doc.text("BIOZENTRA", TXT_X, TOP_H + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text("HEALTHCARE", TXT_X, TOP_H + 30);

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 3 — BILL TO (left) + INVOICE META (right), single bordered box
  // ════════════════════════════════════════════════════════════════════════
  const BOX_Y  = TOP_H + HDR_H + 5;
  const BOX_H  = 50;
  const HALF_W = CW / 2;

  // outer border + vertical divider
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
  doc.rect(ML, BOX_Y, CW, BOX_H, "D");
  doc.line(ML + HALF_W, BOX_Y, ML + HALF_W, BOX_Y + BOX_H);

  // LEFT — Bill To
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...TXT_GREY);
  doc.text("Bill To", ML + 4, BOX_Y + 8);

  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...TXT_DARK);
  doc.text(invoice.customer, ML + 4, BOX_Y + 18);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(80, 90, 95);
  const addrParts = [company.address, company.city, company.country].filter(Boolean);
  const addrLines = doc.splitTextToSize(addrParts.join(", "), HALF_W - 10);
  addrLines.slice(0, 3).forEach((line: string, i: number) => {
    doc.text(line, ML + 4, BOX_Y + 27 + i * 6);
  });

  // RIGHT — Invoice meta (label + bold value, 4 rows)
  const metaRows: [string, string][] = [
    ["Invoice#",     invoice.id],
    ["Invoice Date", invoice.date],
    ["Terms",        "Due on Receipt"],
    ["Due Date",     invoice.dueDate],
  ];
  const RX_LBL = ML + HALF_W + 4;
  const RX_VAL = ML + CW - 4;
  const META_RH = BOX_H / metaRows.length;
  metaRows.forEach(([label, val], i) => {
    const ty = BOX_Y + i * META_RH + META_RH * 0.65;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...TXT_GREY);
    doc.text(label, RX_LBL, ty);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...TXT_DARK);
    doc.text(val, RX_VAL, ty, { align: "right" });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 4 — LINE ITEMS TABLE
  // Columns: # | Item & Description | Qty | Rate | Amount
  // ════════════════════════════════════════════════════════════════════════
  const TBL_Y   = BOX_Y + BOX_H + 5;
  const TBL_HDR = 9;
  const TBL_ROW = 18;  // tall rows to allow item name + sub-description

  const realItems = lineItems ? lineItems.filter(l => l.product && l.unitPrice > 0) : [];
  const MIN_ROWS  = Math.max(realItems.length || 1, 6); // at least 6 rows

  // Column widths (must sum to CW = 182)
  const C_NUM = 12;
  const C_QTY = 24;
  const C_RAT = 36;
  const C_AMT = 36;
  const C_DSC = CW - C_NUM - C_QTY - C_RAT - C_AMT; // ~74

  const X_NUM = ML;
  const X_DSC = X_NUM + C_NUM;
  const X_QTY = X_DSC + C_DSC;
  const X_RAT = X_QTY + C_QTY;
  const X_AMT = X_RAT + C_RAT;

  // Header row (navy)
  doc.setFillColor(...NAVY);
  doc.rect(ML, TBL_Y, CW, TBL_HDR, "F");
  const H_TY = TBL_Y + TBL_HDR * 0.72;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
  doc.text("#",                  X_NUM + C_NUM / 2,  H_TY, { align: "center" });
  doc.text("Item & Description", X_DSC + 3,          H_TY);
  doc.text("Qty",                X_QTY + C_QTY / 2,  H_TY, { align: "center" });
  doc.text("Rate",               X_RAT + C_RAT - 3,  H_TY, { align: "right" });
  doc.text("Amount",             X_AMT + C_AMT - 3,  H_TY, { align: "right" });

  // header vertical dividers (white)
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.2);
  [X_DSC, X_QTY, X_RAT, X_AMT].forEach(x => doc.line(x, TBL_Y, x, TBL_Y + TBL_HDR));

  // Totals calc
  const subtotal  = realItems.length > 0
    ? realItems.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    : invoice.amount;
  const pct       = discountPct ?? invoice.discountPct ?? 0;
  const discAmt   = Math.round(subtotal * pct / 100);
  const totalDue  = subtotal - discAmt;

  // Body rows
  for (let r = 0; r < MIN_ROWS; r++) {
    const ry   = TBL_Y + TBL_HDR + r * TBL_ROW;
    const item = realItems[r];

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.rect(ML, ry, CW, TBL_ROW, "FD");
    [X_DSC, X_QTY, X_RAT, X_AMT].forEach(x => doc.line(x, ry, x, ry + TBL_ROW));

    if (item) {
      // row number
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...TXT_DARK);
      doc.text(String(r + 1), X_NUM + C_NUM / 2, ry + TBL_ROW * 0.55, { align: "center" });
      // item name (bold, upper part of cell)
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(doc.splitTextToSize(item.product, C_DSC - 6)[0], X_DSC + 3, ry + TBL_ROW * 0.38);
      // qty, rate, amount (normal, middle of cell)
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(`${item.qty}.00`,                                X_QTY + C_QTY - 3, ry + TBL_ROW * 0.55, { align: "right" });
      doc.text(`${curr} ${item.unitPrice.toLocaleString()}`,    X_RAT + C_RAT - 3, ry + TBL_ROW * 0.55, { align: "right" });
      doc.text(`${(item.qty * item.unitPrice).toLocaleString()}`, X_AMT + C_AMT - 3, ry + TBL_ROW * 0.55, { align: "right" });
    } else if (r === 0 && realItems.length === 0) {
      // fallback single amount row
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...TXT_DARK);
      doc.text("1", X_NUM + C_NUM / 2, ry + TBL_ROW * 0.55, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text("Invoice Amount", X_DSC + 3, ry + TBL_ROW * 0.38);
      doc.setFont("helvetica", "normal");
      doc.text("1.00",                                         X_QTY + C_QTY - 3, ry + TBL_ROW * 0.55, { align: "right" });
      doc.text(`${curr} ${invoice.amount.toLocaleString()}`,   X_RAT + C_RAT - 3, ry + TBL_ROW * 0.55, { align: "right" });
      doc.text(`${invoice.amount.toLocaleString()}`,           X_AMT + C_AMT - 3, ry + TBL_ROW * 0.55, { align: "right" });
    }
  }

  // Sub Total row
  const SUB_H = 10;
  const SUB_Y = TBL_Y + TBL_HDR + MIN_ROWS * TBL_ROW;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
  doc.rect(ML, SUB_Y, CW, SUB_H, "FD");
  doc.line(X_AMT, SUB_Y, X_AMT, SUB_Y + SUB_H);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...TXT_DARK);
  doc.text("Sub Total",                           X_RAT + C_RAT - 3, SUB_Y + SUB_H * 0.68, { align: "right" });
  doc.text(`${curr} ${subtotal.toLocaleString()}`, X_AMT + C_AMT - 3, SUB_Y + SUB_H * 0.68, { align: "right" });

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 5 — TOTALS BOX (light blue background, right-aligned)
  // ════════════════════════════════════════════════════════════════════════
  const TOT_Y   = SUB_Y + SUB_H;
  const TOT_W   = C_QTY + C_RAT + C_AMT; // right three columns
  const TOT_X   = X_QTY;
  const TOT_RH  = 13;

  const totRows: [string, string, boolean][] = [
    ["DIS %",       pct > 0 ? `${pct.toFixed(2)}%` : "",          false],
    ["Total",       `${curr} ${totalDue.toLocaleString()}`,        true ],
    ["Balance Due", `${curr} ${totalDue.toLocaleString()}`,        true ],
  ];

  totRows.forEach(([label, val, bold], i) => {
    const ry = TOT_Y + i * TOT_RH;
    doc.setFillColor(...BLUE_BG);
    doc.setDrawColor(160, 175, 220); doc.setLineWidth(0.2);
    doc.rect(TOT_X, ry, TOT_W, TOT_RH, "FD");
    const tY = ry + TOT_RH * 0.65;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(...TXT_DARK);
    doc.text(label, TOT_X + 4, tY);
    if (val) {
      doc.setFont("helvetica", "bold");
      doc.text(val, TOT_X + TOT_W - 4, tY, { align: "right" });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 6 — SIGNATURE / STAMP
  // ════════════════════════════════════════════════════════════════════════
  const SIG_Y = TOT_Y + totRows.length * TOT_RH + 24;
  const SIG_W = 55;

  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.7);
  doc.line(ML, SIG_Y, ML + SIG_W, SIG_Y);
  doc.line(W - MR - SIG_W, SIG_Y, W - MR, SIG_Y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...TXT_DARK);
  doc.text("SIGNATURE", ML + SIG_W / 2,       SIG_Y + 6, { align: "center" });
  doc.text("STAMP",     W - MR - SIG_W / 2,   SIG_Y + 6, { align: "center" });

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 7 — FOOTER: dark green bar with phone | email | website
  // ════════════════════════════════════════════════════════════════════════
  const FTR_H = 16;
  const FTR_Y = H - FTR_H;
  doc.setFillColor(...GRN);
  doc.rect(0, FTR_Y, W, FTR_H, "F");

  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
  const FY = FTR_Y + FTR_H * 0.60;
  doc.text(`\u260E  ${phone}`,         W * 0.22, FY, { align: "center" });
  doc.text(`\u2709  ${email}`,         W * 0.52, FY, { align: "center" });
  doc.text(`\u2295  www.biozentra.pk`, W * 0.80, FY, { align: "center" });

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
