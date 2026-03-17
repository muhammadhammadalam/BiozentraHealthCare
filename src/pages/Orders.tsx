import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Filter, Eye, Pencil, Trash2 } from "lucide-react";
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
import { api, ApiOrder } from "@/lib/api";

interface Order {
  id: string;
  customer: string;
  products: string;
  total: number;
  status: string;
  date: string;
}

const initialOrders: Order[] = [
  { id: "ORD-001", customer: "City Pharmacy", products: "Multivitzen Syrup x20", total: 3700, status: "Delivered", date: "2026-01-03" },
  { id: "ORD-002", customer: "MediCare Plus", products: "Kalzen Syrup x15", total: 3300, status: "Processing", date: "2026-01-03" },
  { id: "ORD-003", customer: "HealthFirst Store", products: "Ivyzen Syrup x30", total: 4350, status: "Pending", date: "2026-01-02" },
  { id: "ORD-004", customer: "Apollo Distributors", products: "Mixed Order", total: 12500, status: "Shipped", date: "2026-01-02" },
  { id: "ORD-005", customer: "Wellness Hub", products: "Multivitzen Syrup x50", total: 9250, status: "Delivered", date: "2026-01-01" },
];

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Delivered: "default",
  Processing: "secondary",
  Pending: "outline",
  Shipped: "default",
};

const statusOptions = ["Pending", "Processing", "Shipped", "Delivered"];
const customers = ["City Pharmacy", "MediCare Plus", "HealthFirst Store", "Apollo Distributors", "Wellness Hub"];

interface OrderFormData {
  customer: string;
  products: string;
  total: number;
  status: string;
  date: string;
}

const emptyOrder: OrderFormData = {
  customer: "",
  products: "",
  total: 0,
  status: "Pending",
  date: new Date().toISOString().split('T')[0],
};

const ORDERS_KEY = "biozentra-orders";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem(ORDERS_KEY);
      return stored ? JSON.parse(stored) : initialOrders;
    } catch { return initialOrders; }
  });

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await api.orders.list();
        if (data && data.length > 0) {
          setOrders(data);
          localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
        }
      } catch {
        // Fallback to localStorage on API failure
      }
    };
    loadOrders();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>(emptyOrder);

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.products.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateOrderId = () => {
    const maxNum = Math.max(...orders.map(o => parseInt(o.id.split('-')[1])));
    return `ORD-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customer: order.customer,
        products: order.products,
        total: order.total,
        status: order.status,
        date: order.date,
      });
    } else {
      setEditingOrder(null);
      setFormData(emptyOrder);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOrder(null);
    setFormData(emptyOrder);
  };

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.customer || !formData.products || formData.total <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingOrder) {
      try {
        const updated = await api.orders.update(editingOrder.id, formData);
        setOrders(orders.map(o =>
          o.id === editingOrder.id ? { ...formData, id: updated.id } : o
        ));
        toast.success("Order updated successfully");
      } catch {
        // Fallback: update local state only
        setOrders(orders.map(o =>
          o.id === editingOrder.id ? { ...formData, id: editingOrder.id } : o
        ));
        toast.success("Order updated (offline)");
      }
    } else {
      try {
        const created = await api.orders.create(formData);
        const newOrder: Order = {
          ...formData,
          id: created.id,
        };
        setOrders([newOrder, ...orders]);
        toast.success("Order created successfully");
      } catch {
        // Fallback: use generated ID
        const newOrder: Order = {
          ...formData,
          id: generateOrderId(),
        };
        setOrders([newOrder, ...orders]);
        toast.success("Order created (offline)");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.orders.delete(id);
      setOrders(orders.filter(o => o.id !== id));
      toast.success("Order deleted successfully");
    } catch {
      // Fallback: delete from local state
      setOrders(orders.filter(o => o.id !== id));
      toast.success("Order deleted (offline)");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Orders</h1>
          <p className="mt-1 text-muted-foreground">Track and manage customer orders</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
          <Button size="sm" className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Orders</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.products}</TableCell>
                  <TableCell className="text-right">Rs. {order.total.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status]}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(order)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
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
            <DialogTitle>{editingOrder ? "Edit Order" : "Create New Order"}</DialogTitle>
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
              <Label htmlFor="products">Products *</Label>
              <Input
                id="products"
                value={formData.products}
                onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                placeholder="e.g., Multivitzen Syrup x20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total">Total Amount (Rs.) *</Label>
              <Input
                id="total"
                type="number"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: parseInt(e.target.value) || 0 })}
                placeholder="Enter total amount"
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingOrder ? "Update" : "Create"} Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-medium">{viewingOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{viewingOrder.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">{viewingOrder.products}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">Rs. {viewingOrder.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusColors[viewingOrder.status]}>{viewingOrder.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{viewingOrder.date}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Orders;
