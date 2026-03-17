import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Download, Eye, Pencil, Trash2 } from "lucide-react";
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
import { api, ApiInvoice } from "@/lib/api";

interface Invoice {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  dueDate: string;
}

const initialInvoices: Invoice[] = [
  { id: "INV-2026-001", customer: "City Pharmacy", amount: 45000, status: "Paid", date: "2026-01-03", dueDate: "2026-01-18" },
  { id: "INV-2026-002", customer: "MediCare Plus", amount: 32500, status: "Pending", date: "2026-01-02", dueDate: "2026-01-17" },
  { id: "INV-2026-003", customer: "HealthFirst Store", amount: 28000, status: "Overdue", date: "2025-12-15", dueDate: "2025-12-30" },
  { id: "INV-2026-004", customer: "Apollo Distributors", amount: 125000, status: "Paid", date: "2026-01-01", dueDate: "2026-01-16" },
  { id: "INV-2025-089", customer: "Wellness Hub", amount: 18500, status: "Pending", date: "2025-12-28", dueDate: "2026-01-12" },
];

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  Paid: "default",
  Pending: "secondary",
  Overdue: "destructive",
};

const statusOptions = ["Pending", "Paid", "Overdue"];
const customers = ["City Pharmacy", "MediCare Plus", "HealthFirst Store", "Apollo Distributors", "Wellness Hub"];

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
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

const INVOICES_KEY = "biozentra-invoices";

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem(INVOICES_KEY);
      return stored ? JSON.parse(stored) : initialInvoices;
    } catch { return initialInvoices; }
  });

  useEffect(() => {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await api.invoices.list();
        if (data && data.length > 0) {
          // Map API response (snake_case) to frontend (camelCase)
          const mapped = data.map(inv => ({
            ...inv,
            dueDate: inv.due_date,
          }));
          setInvoices(mapped);
          localStorage.setItem(INVOICES_KEY, JSON.stringify(mapped));
        }
      } catch {
        // Fallback to localStorage on API failure
      }
    };
    loadInvoices();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>(emptyInvoice);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPending = invoices.filter(i => i.status === "Pending").reduce((acc, i) => acc + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "Overdue").reduce((acc, i) => acc + i.amount, 0);

  const generateInvoiceId = () => {
    const year = new Date().getFullYear();
    const existingIds = invoices.filter(i => i.id.includes(`INV-${year}`));
    const maxNum = existingIds.length > 0
      ? Math.max(...existingIds.map(i => parseInt(i.id.split('-')[2])))
      : 0;
    return `INV-${year}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        customer: invoice.customer,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date,
        dueDate: invoice.dueDate,
      });
    } else {
      setEditingInvoice(null);
      setFormData(emptyInvoice);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingInvoice(null);
    setFormData(emptyInvoice);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (invoice: Invoice) => {
    toast.success(`Downloading invoice ${invoice.id}`);
  };

  const handleSave = async () => {
    if (!formData.customer || formData.amount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingInvoice) {
      try {
        // Map camelCase to snake_case for API
        const apiPayload = {
          ...formData,
          due_date: formData.dueDate,
        };
        const updated = await api.invoices.update(editingInvoice.id, apiPayload);
        setInvoices(invoices.map(inv =>
          inv.id === editingInvoice.id
            ? { ...formData, id: updated.id, dueDate: updated.due_date }
            : inv
        ));
        toast.success("Invoice updated successfully");
      } catch {
        // Fallback: update local state only
        setInvoices(invoices.map(inv =>
          inv.id === editingInvoice.id ? { ...formData, id: editingInvoice.id } : inv
        ));
        toast.success("Invoice updated (offline)");
      }
    } else {
      try {
        const apiPayload = {
          ...formData,
          due_date: formData.dueDate,
        };
        const created = await api.invoices.create(apiPayload);
        const newInvoice: Invoice = {
          ...formData,
          id: created.id,
          dueDate: created.due_date,
        };
        setInvoices([newInvoice, ...invoices]);
        toast.success("Invoice created successfully");
      } catch {
        // Fallback: use generated ID
        const newInvoice: Invoice = {
          ...formData,
          id: generateInvoiceId(),
        };
        setInvoices([newInvoice, ...invoices]);
        toast.success("Invoice created (offline)");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.invoices.delete(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success("Invoice deleted successfully");
    } catch {
      // Fallback: delete from local state
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success("Invoice deleted (offline)");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-muted-foreground">Manage billing and payments</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
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
            <p className="text-2xl font-bold text-yellow-600">Rs. {totalPending.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overdue Amount</p>
            <p className="text-2xl font-bold text-destructive">Rs. {totalOverdue.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Invoices</CardTitle>
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
                  <TableCell className="text-right">Rs. {invoice.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[invoice.status]}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(invoice)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={formData.customer}
                onValueChange={(value) => setFormData({ ...formData, customer: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(cust => (
                    <SelectItem key={cust} value={cust}>{cust}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (Rs.) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
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
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
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
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingInvoice ? "Update" : "Create"} Invoice</Button>
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
                <span className="font-medium">Rs. {viewingInvoice.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusColors[viewingInvoice.status]}>{viewingInvoice.status}</Badge>
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
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            {viewingInvoice && (
              <Button onClick={() => handleDownload(viewingInvoice)}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Invoices;
