import jsPDF, { GState } from "jspdf";
import autoTable from "jspdf-autotable";

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
        address: s.address || "",
        city: s.city || "",
        country: s.country || "",
        email: s.email || "",
        phone: s.phone || "",
        currency: s.currency || "PKR",
      };
    }
  } catch {
    // ignore
  }
  return {
    companyName: "BIOZENTRA Healthcare",
    address: "",
    city: "",
    country: "",
    email: "",
    phone: "",
    currency: "PKR",
  };
}

// Biozentra logo embedded as base64 for PDF watermark
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfgAAAHyCAYAAAAHs9wZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACmXSURBVHhe7d15eFT1vcfxTwJhSQIJRnaQ5SJ4JVwmCuIt+1JXytICiigkLPZSlcVqFbTlogWxrbKouLGKgEWsUKgoS0gKooiQiChSFFAMICgmQAClJPcPydyc38wkM8NMMvnxfj3PPI/zPSdgaOqbc+b8zom65pprCgUAAKwSlZKSQuABALBMlMvlIvAAAFgmyuVyFRYW/tT4rKwsczsAAKhgUlJSFF30pijyAACgYgsLC///QQcAALAHgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsFOVyuQoLCwtVWFio7OxsczsAAKhgUlJSFF30pijyAACgYgsLC///QQcAALAHgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAABb6P/mBrQ/RK0ZJAAAAAElFTkSuQmCC";

/**
 * Adds the Biozentra logo as a centered, semi-transparent watermark on every page.
 */
const addLogoWatermark = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const logoSize = 80; // mm - square logo centered on page
  const x = (pageWidth - logoSize) / 2;
  const y = (pageHeight - logoSize) / 2;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    try {
      doc.saveGraphicsState();
      doc.setGState(new GState({ opacity: 0.07, "stroke-opacity": 0.07 }));
      doc.addImage(LOGO_BASE64, "PNG", x, y, logoSize, logoSize);
      doc.restoreGraphicsState();
    } catch {
      // Fallback without opacity if GState not supported
      doc.addImage(LOGO_BASE64, "PNG", x, y, logoSize, logoSize);
    }
  }
};

export const exportOrdersToPDF = (orders: OrderExport[]) => {
  const company = loadCompanyInfo();
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 128);
  doc.text(company.companyName || "BIOZENTRA Healthcare", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Orders Report", 14, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Order ID", "Customer", "Date", "Items", `Total (${company.currency || "PKR"})`, "Status"]],
    body: orders.map((order) => [
      order.id,
      order.customer,
      order.date,
      order.items.toString(),
      order.total.toLocaleString(),
      order.status,
    ]),
    headStyles: {
      fillColor: [0, 128, 128],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });

  // Add logo watermark on all pages
  addLogoWatermark(doc);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`biozentra-orders-${new Date().toISOString().split("T")[0]}.pdf`);
};

export const exportInvoicesToPDF = (invoices: InvoiceExport[]) => {
  const company = loadCompanyInfo();
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 128);
  doc.text(company.companyName || "BIOZENTRA Healthcare", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Invoices Report", 14, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

  // Summary
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const curr = company.currency || "PKR";
  doc.text(`Total: ${curr} ${totalAmount.toLocaleString()}`, 140, 32);
  doc.text(`Pending: ${curr} ${pendingAmount.toLocaleString()}`, 140, 40);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Invoice ID", "Customer", "Date", "Due Date", `Amount (${curr})`, "Status"]],
    body: invoices.map((invoice) => [
      invoice.id,
      invoice.customer,
      invoice.date,
      invoice.dueDate,
      invoice.amount.toLocaleString(),
      invoice.status,
    ]),
    headStyles: {
      fillColor: [0, 128, 128],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const status = data.cell.raw as string;
        if (status === "Paid") {
          data.cell.styles.textColor = [0, 128, 0];
        } else if (status === "Overdue") {
          data.cell.styles.textColor = [255, 0, 0];
        } else if (status === "Pending") {
          data.cell.styles.textColor = [255, 165, 0];
        }
      }
    },
  });

  // Add logo watermark on all pages
  addLogoWatermark(doc);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`biozentra-invoices-${new Date().toISOString().split("T")[0]}.pdf`);
};

export const exportSingleInvoicePDF = (invoice: InvoiceExport) => {
  const company = loadCompanyInfo();
  const doc = new jsPDF();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 128, 128);
  doc.text(company.companyName || "BIOZENTRA Healthcare", 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);

  // Build address line from settings
  const addressParts = [company.address, company.city, company.country].filter(Boolean);
  const addressLine = addressParts.join(", ");
  if (addressLine) {
    doc.text(addressLine, 14, 33);
  }

  // Build contact line from settings
  const contactParts = [company.email, company.phone].filter(Boolean);
  const contactLine = contactParts.join(" | ");
  if (contactLine) {
    doc.text(contactLine, 14, addressLine ? 40 : 33);
  }

  const curr = company.currency || "PKR";

  // Invoice title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text("INVOICE", 150, 25);

  doc.setFontSize(11);
  doc.text(invoice.id, 150, 33);
  doc.setTextColor(100);
  doc.text(`Date: ${invoice.date}`, 150, 41);
  doc.text(`Due: ${invoice.dueDate}`, 150, 49);

  // Divider
  doc.setDrawColor(200);
  doc.line(14, 55, 196, 55);

  // Bill To
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("BILL TO:", 14, 70);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(invoice.customer, 14, 78);

  // Amount box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(120, 65, 76, 25, 3, 3, "F");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("AMOUNT DUE", 130, 75);
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`${curr} ${invoice.amount.toLocaleString()}`, 130, 85);

  // Status
  const statusColors: Record<string, [number, number, number]> = {
    Paid: [0, 128, 0],
    Pending: [255, 165, 0],
    Overdue: [255, 0, 0],
  };
  doc.setFontSize(12);
  doc.setTextColor(...(statusColors[invoice.status] || [0, 0, 0]));
  doc.text(`Status: ${invoice.status}`, 14, 100);

  // Add logo watermark
  addLogoWatermark(doc);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 14, doc.internal.pageSize.height - 20);
  doc.text(
    "Generated by Biozentra Healthcare Dashboard",
    14,
    doc.internal.pageSize.height - 14
  );

  doc.save(`${invoice.id}.pdf`);
};
