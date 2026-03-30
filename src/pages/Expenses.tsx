import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, Pencil, Trash2, Receipt, TrendingDown, Filter,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
}

const EXPENSES_KEY = "biozentra-expenses";

const CATEGORIES = [
  "Procurement",
  "Salaries & Wages",
  "Utilities",
  "Rent",
  "Transport & Delivery",
  "Marketing",
  "Maintenance & Repairs",
  "Office Supplies",
  "Insurance",
  "Professional Services",
  "Miscellaneous",
];

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Credit Card", "Mobile Wallet"];

const categoryColors: Record<string, "default" | "secondary" | "outline"> = {
  Procurement:              "default",
  "Salaries & Wages":       "secondary",
  Utilities:                "outline",
  Rent:                     "secondary",
  "Transport & Delivery":   "default",
  Marketing:                "default",
};

const emptyForm: Omit<Expense, "id"> = {
  date: new Date().toISOString().split("T")[0],
  category: "",
  description: "",
  amount: 0,
  paymentMethod: "Cash",
  reference: "",
};

function loadExpenses(): Expense[] {
  try {
    const stored = localStorage.getItem(EXPENSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveExpenses(expenses: Expense[]) {
  try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)); } catch { /* ignore */ }
}

function makeId() {
  return `EXP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Expense, "id">>(emptyForm);

  const persist = (updated: Expense[]) => {
    setExpenses(updated);
    saveExpenses(updated);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
    const totalThisMonth = expenses
      .filter((e) => e.date.startsWith(thisMonth))
      .reduce((s, e) => s + e.amount, 0);
    const totalLastMonth = expenses
      .filter((e) => e.date.startsWith(lastMonth))
      .reduce((s, e) => s + e.amount, 0);

    // Top category this month
    const catMap: Record<string, number> = {};
    expenses.filter((e) => e.date.startsWith(thisMonth)).forEach((e) => {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
    });
    const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return { totalAll, totalThisMonth, totalLastMonth, topCategory };
  }, [expenses]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return expenses
      .filter((e) =>
        (filterCategory === "all" || e.category === filterCategory) &&
        (
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, searchQuery, filterCategory]);

  // ── Dialog open/close ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
    setIsDialogOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setFormData({
      date: exp.date,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod,
      reference: exp.reference || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => { setIsDialogOpen(false); setEditingId(null); };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!formData.date)        { toast.error("Date is required"); return; }
    if (!formData.category)    { toast.error("Category is required"); return; }
    if (!formData.description.trim()) { toast.error("Description is required"); return; }
    if (formData.amount <= 0)  { toast.error("Amount must be greater than 0"); return; }

    if (editingId) {
      const updated = expenses.map((e) =>
        e.id === editingId ? { ...formData, id: editingId } : e
      );
      persist(updated);
      toast.success("Expense updated");
    } else {
      persist([{ ...formData, id: makeId() }, ...expenses]);
      toast.success("Expense added");
    }
    closeDialog();
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this expense?")) return;
    persist(expenses.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Expenses</h1>
          <p className="mt-1 text-muted-foreground">Track and manage all business expenses</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Expenses",
            value: `Rs. ${stats.totalAll.toLocaleString()}`,
            sub: "All time",
            icon: Receipt,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "This Month",
            value: `Rs. ${stats.totalThisMonth.toLocaleString()}`,
            sub: stats.totalLastMonth > 0
              ? `vs Rs. ${stats.totalLastMonth.toLocaleString()} last month`
              : "No data last month",
            icon: TrendingDown,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
          {
            label: "Top Category",
            value: stats.topCategory,
            sub: "Highest spend this month",
            icon: Filter,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-full p-3 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Expenses ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* Category filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search expenses..." className="pl-9 w-56"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <Receipt className="h-12 w-12 opacity-25 mb-3" />
              <p className="font-medium">No expenses found</p>
              <p className="text-sm mt-1">Click "Add Expense" to start tracking.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount (Rs.)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((exp, i) => (
                  <motion.tr key={exp.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{exp.id}</TableCell>
                    <TableCell className="text-muted-foreground">{exp.date}</TableCell>
                    <TableCell>
                      <Badge variant={categoryColors[exp.category] ?? "outline"} className="text-xs">
                        {exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] font-medium">
                      <span className="block truncate">{exp.description}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.paymentMethod}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exp.reference || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {exp.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Monthly total footer */}
          {filtered.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="rounded-lg border bg-muted/30 px-6 py-3 text-sm">
                <span className="text-muted-foreground">Showing total: </span>
                <span className="font-bold text-destructive ml-1">
                  Rs. {filtered.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid gap-1.5">
              <Label>Date *</Label>
              <Input type="date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>

            {/* Category */}
            <div className="grid gap-1.5">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label>Description *</Label>
              <Input
                placeholder="e.g. Monthly utility bill – KESC"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Amount */}
            <div className="grid gap-1.5">
              <Label>Amount (Rs.) *</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={formData.amount === 0 ? "" : formData.amount.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })
                }
              />
            </div>

            {/* Payment Method */}
            <div className="grid gap-1.5">
              <Label>Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Reference / Invoice No */}
            <div className="grid gap-1.5">
              <Label>Reference / Invoice No. <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="e.g. INV-001, Bill #2026-03"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Add"} Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Expenses;
