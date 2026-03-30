import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Download, Eye, Pencil, Trash2, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { exportSingleInvoicePDF, exportInvoicesToPDF } from "@/utils/pdfExport";

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  Paid: "default",
  Pending: "secondary",
  Overdue: "destructive",
};

const statusOptions = ["Pending", "Paid", "Overdue"];

interface InvoiceFormData {
  customer: string;
  amount: number;
  status: string;
  date: string;
  dueDate: string;
}

const emptyInvoice: InvoiceFormData = {
  customer: "",
  amount: 0,
  status: "Pending",
  date: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
};

const Invoices = () => {
  const { invoices, customers, addInvoice, updateInvoice, deleteInvoice } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<(typeof invoices)[0] | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>(emptyInvoice);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPending = invoices
    .filter((i) => i.status === "Pending")
    .reduce((acc, i) => acc + i.amount, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "Overdue")
    .reduce((acc, i) => acc + i.amount, 0);

  const handleOpenDialog = (invoiceId?: string) => {
    if (invoiceId) {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (invoice) {
        setEditingId(invoiceId);
        setFormData({
          customer: invoice.customer,
          amount: invoice.amount,
          status: invoice.status,
          date: invoice.date,
          dueDate: invoice.dueDate,
        });
      }
    } else {
      setEditingId(null);
      setFormData(emptyInvoice);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(emptyInvoice);
  };

  const handleViewInvoice = (invoice: (typeof invoices)[0]) => {
    setViewingInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleDownloadSingle = async (invoice: (typeof invoices)[0]) => {
    try {
      await exportSingleInvoicePDF({
        id: invoice.id,
        customer: invoice.customer,
        date: invoice.date,
        dueDate: invoice.dueDate,
        amount: invoice.amount,
        status: invoice.status,
      });
      toast.success(`Invoice ${invoice.id} downloaded`);
    } catch {
      toast.error("Failed to generate invoice PDF");
    }
  };

  const handleDownloadAll = async () => {
    if (invoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }
    try {
      await exportInvoicesToPDF(
        invoices.map((i) => ({
          id: i.id,
          customer: i.customer,
          date: i.date,
          dueDate: i.dueDate,
          amount: i.amount,
          status: i.status,
        }))
      );
      toast.success("Invoices report downloaded");
    } catch {
      toast.error("Failed to export invoices");
    }
  };

  const handleSave = async () => {
    if (!formData.customer || formData.amount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editingId) {
        await updateInvoice(editingId, formData);
        toast.success("Invoice updated successfully");
      } else {
        await addInvoice(formData);
        toast.success("Invoice created successfully");
      }
      handleCloseDialog();
    } catch {
      toast.error("Failed to save invoice. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted");
    } catch {
      toast.error("Failed to delete invoice.");
    }
  };

  const customerNames = customers.map((c) => c.name);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-muted-foreground">Manage billing and payments</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          {invoices.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Export All
            </Button>
          )}
          <Button size="sm" className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Amount</p>
            <p className="text-2xl font-bold text-yellow-600">
              Rs. {totalPending.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overdue Amount</p>
            <p className="text-2xl font-bold text-destructive">
              Rs. {totalOverdue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 opacity-30 mb-3" />
              <p className="font-medium">No invoices yet</p>
              <p className="text-sm mt-1">Click "Create Invoice" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, i) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell className="text-right">
                      Rs. {invoice.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[invoice.status]}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadSingle(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(invoice.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              {customerNames.length > 0 ? (
                <Select
                  value={formData.customer}
                  onValueChange={(value) => setFormData({ ...formData, customer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  placeholder="Enter customer name (add customers first)"
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (Rs.) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
                }
                placeholder="Enter amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Invoice Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Create"} Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice ID</span>
                <span className="font-medium">{viewingInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{viewingInvoice.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">Rs. {viewingInvoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusColors[viewingInvoice.status]}>
                  {viewingInvoice.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Date</span>
                <span className="font-medium">{viewingInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">{viewingInvoice.dueDate}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {viewingInvoice && (
              <Button onClick={() => handleDownloadSingle(viewingInvoice)}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Invoices;
