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

// Biozentra logo embedded as base64 for PDF watermark
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfgAAAHyCAYAAAAHs9wZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACmXSURBVHhe7d15eFT1vcfxTwJhSQIJRnaQ5SJ4JVwmCuIt+1JXytICiigkLPZSlcVqFbTlogWxrbKouLGKgEWsUKgoS0gKooiQiChSFFAMICgmQAClJPcPydyc38wkM8NMMvnxfj3PPI/zPSdgaOqbc+b8zom65pprCgUAAKwSlZKSQuABALBMlMvlIvAAAFgmyuVyFRYW/tT4rKwsczsAAKhgUlJSFF30pijyAACgYissLPz/wAMAAHsQeAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4AAAsReAAALETgAQCwEIEHAMBCBB4A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GxHdtn27rmjcSC/MneeYe1P0/f3pz39RtWrV9OBv79ctN9ygBx951NzVp1D9jADlhWVyQJD27dunz/Z+rsaNGio3N9f9OpGXp6aNG2n9OvvD0P2GG5X10U598cUX5iaHR373oCY++IA59lBQUKANGzeqSaNGjj/T3NxcNbmisXbt/kw5OTnml/lUr149tWvXTnf/z2it/Mdb2rhxo7kLYDUCDwRh0dy5ali/nma/PEczn3/e8frLzFn69vhxZWRkmF9mlcGDB6thg/p6cPw4HT582NwsSXpq2hPK2LRZt/brb27y8M477+jkqVOa8dxsjz/T5+fMVe2kJC2aN9f8slINHjxY17drpyf++EcdOnTI3AxYi8DjknT+/HllZ2d7vD7++GNzVw8//PCDNr//nn5+403mJklS/fr1dXWrVnp9yWJzk09btmzR+vXr3a+9e/eau0Sc6OhoTX/mWVWKjtbQO4do+pNPavv27fr000+1fPlyDb1jsFasWq37xo5Vx44dzS/38Oayv+q/Wl+tJC93j5OkHj17KvOfmwK+aY4kPTZtmuJiY/XAuLE6d+6cudmri/kZASIBgccl6dTpfP1m9P94vO67p/QrrJcvX65z587p9jv+/0IwU59fDdDOTz7VkSNHzE1evfD8bP3h94+6X6/OK/2z5iKVK1VSpVI+Lw+XunXrasHiJereubPeXrdW9917j0aOGK4ZTz+typUq6ekZM3T77bebX+bhq6++0qd7/qX+t/ned8jQoTp95oxWrlxpbipVbGysHn/iCeUcPqLJjz5ibvbqYn5GgEjARXYAQqKgoEAHDx5Ufn6+GjdurBo1api7ACgjXGQHIGSio6PVpEkTXX311cQdiAAEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAACxF4AAAsROABALAQgQcAwEIEHgAAC/0fBMAodcfak3MAAAAASUVORK5CYII=";

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
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 128);
  doc.text("BIOZENTRA Healthcare", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Orders Report", 14, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Order ID", "Customer", "Date", "Items", "Total (Rs.)", "Status"]],
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
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 128);
  doc.text("BIOZENTRA Healthcare", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Invoices Report", 14, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

  // Summary
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  doc.text(`Total: Rs. ${totalAmount.toLocaleString()}`, 140, 32);
  doc.text(`Pending: Rs. ${pendingAmount.toLocaleString()}`, 140, 40);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Invoice ID", "Customer", "Date", "Due Date", "Amount (Rs.)", "Status"]],
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
  const doc = new jsPDF();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 128, 128);
  doc.text("BIOZENTRA Healthcare", 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("123 Healthcare Street, Mumbai, India", 14, 33);
  doc.text("contact@biozentra.com | +91 98765 43210", 14, 40);

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
  doc.text(`Rs. ${invoice.amount.toLocaleString()}`, 130, 85);

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
