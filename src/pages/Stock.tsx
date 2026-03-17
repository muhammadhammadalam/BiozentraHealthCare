import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, AlertTriangle, Package, TrendingDown, ArrowUpDown, Plus, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
import { api, ApiInventory } from "@/lib/api";

interface StockItem {
  id: number;
  name: string;
  batch: string;
  quantity: number;
  maxStock: number;
  expiry: string;
  status: string;
}

const initialStockItems: StockItem[] = [
  { id: 1, name: "Multivitzen Syrup", batch: "MV-2026-001", quantity: 245, maxStock: 500, expiry: "2027-06", status: "Healthy" },
  { id: 2, name: "Kalzen Syrup", batch: "KZ-2026-012", quantity: 180, maxStock: 400, expiry: "2027-08", status: "Healthy" },
  { id: 3, name: "Ivyzen Syrup", batch: "IV-2025-045", quantity: 12, maxStock: 300, expiry: "2026-03", status: "Critical" },
  { id: 4, name: "Multivitzen Syrup", batch: "MV-2025-089", quantity: 45, maxStock: 500, expiry: "2026-04", status: "Low" },
  { id: 5, name: "Kalzen Syrup", batch: "KZ-2025-078", quantity: 0, maxStock: 400, expiry: "2026-02", status: "Out" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Healthy": return "default";
    case "Low": return "secondary";
    case "Critical": return "destructive";
    case "Out": return "destructive";
    default: return "outline";
  }
};

const getAutoStatus = (quantity: number, maxStock: number): string => {
  if (quantity === 0) return "Out";
  const pct = (quantity / maxStock) * 100;
  if (pct < 5) return "Critical";
  if (pct < 20) return "Low";
  return "Healthy";
};

const emptyItem: Omit<StockItem, "id" | "status"> = {
  name: "",
  batch: "",
  quantity: 0,
  maxStock: 0,
  expiry: "",
};

const STOCK_KEY = "biozentra-stock";

const Stock = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const stored = localStorage.getItem(STOCK_KEY);
      return stored ? JSON.parse(stored) : initialStockItems;
    } catch { return initialStockItems; }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<Omit<StockItem, "id" | "status">>(emptyItem);

  useEffect(() => {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    const loadStock = async () => {
      try {
        const data = await api.inventory.list();
        if (data && data.length > 0) {
          // Map API response (snake_case) to frontend (camelCase)
          const mapped = data.map(inv => ({
            id: inv.id,
            name: inv.name,
            batch: inv.batch,
            quantity: inv.quantity,
            maxStock: inv.max_stock,
            expiry: inv.expiry,
            status: getAutoStatus(inv.quantity, inv.max_stock),
          }));
          setStockItems(mapped);
          localStorage.setItem(STOCK_KEY, JSON.stringify(mapped));
        }
      } catch {
        // Fallback to localStorage on API failure
      }
    };
    loadStock();
  }, []);

  const filtered = stockItems
    .filter(
      (i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.batch.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => sortAsc ? a.quantity - b.quantity : b.quantity - a.quantity);

  const lowStockCount = stockItems.filter((i) => i.status === "Low" || i.status === "Critical").length;
  const outOfStockCount = stockItems.filter((i) => i.status === "Out").length;

  const handleOpenDialog = (item?: StockItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, batch: item.batch, quantity: item.quantity, maxStock: item.maxStock, expiry: item.expiry });
    } else {
      setEditingItem(null);
      setFormData(emptyItem);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData(emptyItem);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.batch || formData.maxStock <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    const status = getAutoStatus(formData.quantity, formData.maxStock);
    if (editingItem) {
      try {
        // Map camelCase to snake_case for API
        const apiPayload = {
          ...formData,
          max_stock: formData.maxStock,
          product_id: null, // Ignore product_id
        };
        const updated = await api.inventory.update(editingItem.id, apiPayload);
        setStockItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id
              ? {
                  ...formData,
                  id: updated.id,
                  maxStock: updated.max_stock,
                  status: getAutoStatus(formData.quantity, updated.max_stock),
                }
              : i
          )
        );
        toast.success("Stock item updated successfully");
      } catch {
        // Fallback: update local state only
        setStockItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...formData, id: editingItem.id, status } : i))
        );
        toast.success("Stock item updated (offline)");
      }
    } else {
      try {
        const apiPayload = {
          ...formData,
          max_stock: formData.maxStock,
          product_id: null, // Ignore product_id
        };
        const created = await api.inventory.create(apiPayload);
        const newItem: StockItem = {
          ...formData,
          id: created.id,
          maxStock: created.max_stock,
          status: getAutoStatus(formData.quantity, created.max_stock),
        };
        setStockItems((prev) => [...prev, newItem]);
        toast.success("Stock item added successfully");
      } catch {
        // Fallback: use temp ID
        const newItem: StockItem = {
          ...formData,
          id: Math.max(0, ...stockItems.map((i) => i.id)) + 1,
          status,
        };
        setStockItems((prev) => [...prev, newItem]);
        toast.success("Stock item added (offline)");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.inventory.delete(id);
      setStockItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Stock item deleted successfully");
    } catch {
      // Fallback: delete from local state
      setStockItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Stock item deleted (offline)");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Stock Management</h1>
          <p className="mt-1 text-muted-foreground">Monitor inventory levels and alerts</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <Button size="sm" className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> Add Stock Item
          </Button>
        </motion.div>
      </div>

      {/* Stock Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stockItems.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-yellow-500/10 p-3">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Stock Levels</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search stock..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setSortAsc(!sortAsc)}>
                <ArrowUpDown className="h-4 w-4" /> {sortAsc ? "Qty ↑" : "Qty ↓"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{item.name}</h3>
                    <Badge variant={getStatusColor(item.status) as "default" | "secondary" | "destructive" | "outline"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Batch: {item.batch} • Expiry: {item.expiry}</p>
                </div>
                <div className="w-full sm:w-48">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.quantity} units</span>
                    <span className="text-muted-foreground">/ {item.maxStock}</span>
                  </div>
                  <Progress value={(item.quantity / item.maxStock) * 100} className="h-2" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No stock items found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Stock Item" : "Add Stock Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Batch Number *</Label>
              <Input
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="e.g. MV-2026-001"
              />
            </div>
            <div className="grid gap-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                placeholder="Current quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label>Max Stock *</Label>
              <Input
                type="number"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                placeholder="Maximum stock capacity"
              />
            </div>
            <div className="grid gap-2">
              <Label>Expiry (YYYY-MM)</Label>
              <Input
                value={formData.expiry}
                onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                placeholder="e.g. 2027-06"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingItem ? "Update" : "Add"} Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Stock;
