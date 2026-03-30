import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search, Plus, Eye, Pencil, Trash2, ShoppingCart, FileText,
  PlusCircle, MinusCircle, Download, Tag,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useData, LineItem } from "@/contexts/DataContext";
import { exportSingleInvoicePDF } from "@/utils/pdfExport";
import { CATALOG as CATALOG_ITEMS, CATALOG_MAP as CATALOG } from "@/lib/catalog";

// ─── Predefined product catalog ────────────────────────────────────────────────


// ─── helpers ──────────────────────────────────────────────────────────────────
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Delivered: "default",
  Processing: "secondary",
  Pending: "outline",
  Shipped: "default",
};
const statusOptions = ["Pending", "Processing", "Shipped", "Delivered"];

function newLineItem(): LineItem {
  return { id: Date.now().toString(), product: "", qty: 1, unitPrice: 0 };
}

function lineItemsToString(items: LineItem[]) {
  return items.filter(i => i.product).map(i => `${i.product} x${i.qty}`).join(", ");
}

function calcSubtotal(items: LineItem[]) {
  return items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}

// ─── component ────────────────────────────────────────────────────────────────
const Orders = () => {
  const { orders, customers, products: allProducts, addOrder, updateOrder, deleteOrder, addInvoice, updateProduct } = useData();

  const customerNames = customers.map((c) => c.name);

  // Merge catalog names with inventory product names (catalog first, deduplicated)
  const allProductNames = [
    ...Object.keys(CATALOG),
    ...allProducts.map(p => p.name).filter(n => !(n in CATALOG)),
  ];

  const [searchQuery, setSearchQuery] = useState("");

  // ── create/edit dialog ────────────────────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCustomer, setFormCustomer] = useState("");
  const [formStatus, setFormStatus] = useState("Pending");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [discountPct, setDiscountPct] = useState("");

  const subtotal   = useMemo(() => calcSubtotal(lineItems), [lineItems]);
  const discountAmt = useMemo(() => subtotal * (parseFloat(discountPct) || 0) / 100, [subtotal, discountPct]);
  const grandTotal  = useMemo(() => subtotal - discountAmt, [subtotal, discountAmt]);

  const openCreate = () => {
    setEditingId(null);
    setFormCustomer("");
    setFormStatus("Pending");
    setFormDate(new Date().toISOString().split("T")[0]);
    setLineItems([newLineItem()]);
    setDiscountPct("");
    setIsDialogOpen(true);
  };

  const openEdit = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setEditingId(orderId);
    setFormCustomer(order.customer);
    setFormStatus(order.status);
    setFormDate(order.date);
    setLineItems(
      order.lineItems && order.lineItems.length > 0
        ? order.lineItems
        : [{ id: "legacy", product: order.products, qty: 1, unitPrice: order.total }]
    );
    setDiscountPct("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => { setIsDialogOpen(false); setEditingId(null); };

  // line item helpers
  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        // Auto-fill unit price from catalog when product is selected
        if (field === "product") {
          const catalogPrice = CATALOG[value];
          return catalogPrice !== undefined
            ? { ...item, product: value, unitPrice: catalogPrice }
            : { ...item, product: value };
        }
        if (field === "qty" || field === "unitPrice") {
          const num = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
          return { ...item, [field]: num };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const addItem = () => setLineItems((prev) => [...prev, newLineItem()]);
  const removeItem = (id: string) =>
    setLineItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  // Apply a net stock delta map { productName -> qtyChange (negative = deduct, positive = restore) }
  const applyStockDelta = async (delta: Record<string, number>) => {
    const STOCK_KEY = "biozentra-stock";

    // 1. Apply to DataContext products (Supabase)
    for (const [name, change] of Object.entries(delta)) {
      if (change === 0) continue;
      const product = allProducts.find((p) => p.name === name);
      if (product) {
        const newStock = Math.max(0, product.stock + change);
        try { await updateProduct(product.id, { stock: newStock }); } catch { /* non-blocking */ }
      }
    }

    // 2. Apply to localStorage stock items (Stock page)
    try {
      const stored = localStorage.getItem(STOCK_KEY);
      const stockItems: Array<{ id: number; name: string; quantity: number; maxStock: number; status: string }> =
        stored ? JSON.parse(stored) : [];
      const updated = stockItems.map((si) => {
        const change = delta[si.name];
        if (change === undefined || change === 0) return si;
        const newQty = Math.max(0, si.quantity + change);
        const pct = si.maxStock > 0 ? (newQty / si.maxStock) * 100 : 0;
        const status = newQty === 0 ? "Out" : pct < 5 ? "Critical" : pct < 20 ? "Low" : "Healthy";
        return { ...si, quantity: newQty, status };
      });
      localStorage.setItem(STOCK_KEY, JSON.stringify(updated));
    } catch { /* non-blocking */ }
  };

  // Build a delta map from old → new line items (positive = stock restored, negative = deducted)
  const buildDelta = (oldItems: LineItem[], newItems: LineItem[]): Record<string, number> => {
    const delta: Record<string, number> = {};
    // Restore old quantities
    for (const item of oldItems) {
      if (item.product) delta[item.product] = (delta[item.product] ?? 0) + item.qty;
    }
    // Deduct new quantities
    for (const item of newItems) {
      if (item.product) delta[item.product] = (delta[item.product] ?? 0) - item.qty;
    }
    return delta;
  };

  const handleSave = async () => {
    if (!formCustomer.trim()) { toast.error("Select a customer"); return; }
    const validItems = lineItems.filter((i) => i.product.trim());
    if (validItems.length === 0) { toast.error("Add at least one item"); return; }

    // For edits, the effective available stock = current stock + what the old order already consumed
    const oldItems = editingId
      ? (orders.find((o) => o.id === editingId)?.lineItems ?? []).filter((i) => i.product.trim())
      : [];

    // Build per-product effective available stock for warnings
    const effectiveStock: Record<string, number> = {};
    for (const p of allProducts) {
      effectiveStock[p.name] = p.stock;
    }
    // Add back old quantities so edit warnings are accurate
    for (const item of oldItems) {
      if (item.product) effectiveStock[item.product] = (effectiveStock[item.product] ?? 0) + item.qty;
    }

    const stockWarnings: string[] = [];
    for (const item of validItems) {
      const available = effectiveStock[item.product] ?? 0;
      if (item.qty > available) {
        stockWarnings.push(`${item.product}: ordered ${item.qty}, only ${available} available`);
      }
    }
    if (stockWarnings.length > 0) {
      const confirmed = window.confirm(
        `Stock warning:\n${stockWarnings.join("\n")}\n\nProceed anyway?`
      );
      if (!confirmed) return;
    }

    const products = lineItemsToString(validItems);
    const total = grandTotal;
    const discountPctNum = parseFloat(discountPct) || 0;

    try {
      if (editingId) {
        await updateOrder(editingId, { customer: formCustomer, products, total, status: formStatus, date: formDate, lineItems: validItems, discountPct: discountPctNum });
        // Net delta: restore old quantities, deduct new quantities
        await applyStockDelta(buildDelta(oldItems, validItems));
        toast.success("Order updated");
      } else {
        await addOrder({ customer: formCustomer, products, total, status: formStatus, date: formDate, lineItems: validItems, discountPct: discountPctNum });
        // New order: purely deduct
        await applyStockDelta(buildDelta([], validItems));
        toast.success("Order created");
      }
      closeDialog();
    } catch {
      toast.error("Failed to save order. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this order?")) {
      try {
        await deleteOrder(id);
        toast.success("Order deleted");
      } catch {
        toast.error("Failed to delete order.");
      }
    }
  };

  // ── view dialog ───────────────────────────────────────────────────────────
  const [viewingOrder, setViewingOrder] = useState<(typeof orders)[0] | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const openView = (order: (typeof orders)[0]) => {
    setViewingOrder(order);
    setIsViewOpen(true);
  };

  // ── issue invoice dialog ──────────────────────────────────────────────────
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceSource, setInvoiceSource] = useState<(typeof orders)[0] | null>(null);
  const [invDueDate, setInvDueDate] = useState("");
  const [invStatus, setInvStatus] = useState("Pending");
  const [invDiscountPct, setInvDiscountPct] = useState("");

  const invSubtotal    = useMemo(() => invoiceSource ? calcSubtotal(invoiceSource.lineItems || []) : 0, [invoiceSource]);
  const invDiscountAmt = useMemo(() => invSubtotal * (parseFloat(invDiscountPct) || 0) / 100, [invSubtotal, invDiscountPct]);
  const invTotal       = useMemo(() => {
    // If source has lineItems, recalculate with discount; else use stored total
    if (invoiceSource?.lineItems?.length) return invSubtotal - invDiscountAmt;
    return invoiceSource?.total ?? 0;
  }, [invoiceSource, invSubtotal, invDiscountAmt]);

  const openIssueInvoice = (order: (typeof orders)[0]) => {
    setInvoiceSource(order);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setInvDueDate(due.toISOString().split("T")[0]);
    setInvStatus("Pending");
    // Auto-carry discount from the order
    setInvDiscountPct(order.discountPct ? order.discountPct.toString() : "");
    setIsInvoiceOpen(true);
  };

  const handleIssueInvoice = async (downloadNow: boolean) => {
    if (!invoiceSource) return;
    const invoiceData = {
      customer: invoiceSource.customer,
      date: invoiceSource.date,
      dueDate: invDueDate,
      amount: invTotal,
      status: invStatus,
      discountPct: parseFloat(invDiscountPct) || 0,
    };
    try {
      await addInvoice(invoiceData);
    } catch {
      toast.error("Failed to save invoice.");
      return;
    }

    if (downloadNow) {
      const tempId = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      exportSingleInvoicePDF(
        { ...invoiceData, id: tempId },
        invoiceSource.lineItems,
        parseFloat(invDiscountPct) || 0
      );
      toast.success("Invoice created and PDF downloaded!");
    } else {
      toast.success("Invoice saved to Invoices page");
    }
    setIsInvoiceOpen(false);
  };

  // ── filter ────────────────────────────────────────────────────────────────
  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.products.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Orders</h1>
          <p className="mt-1 text-muted-foreground">Manage and track all orders</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            All Orders ({orders.length})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search orders..." className="pl-9" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ShoppingCart className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Click "New Order" to create your first order.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {order.products || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rs. {order.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[order.status] ?? "outline"}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="View" onClick={() => openView(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(order.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Issue Invoice"
                          onClick={() => openIssueInvoice(order)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(order.id)}>
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

      {/* ── Create / Edit Order Dialog ───────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Order" : "Create New Order"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Customer */}
            <div className="grid gap-1.5">
              <Label>Customer *</Label>
              {customerNames.length > 0 ? (
                <Select value={formCustomer} onValueChange={setFormCustomer}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customerNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formCustomer} onChange={(e) => setFormCustomer(e.target.value)}
                  placeholder="Customer name (add customers first)" />
              )}
            </div>

            {/* Date + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-base font-semibold">Order Items *</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
                  <PlusCircle className="h-4 w-4" /> Add Item
                </Button>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[30px_1fr_90px_110px_100px_32px] gap-2 mb-1 text-xs font-medium text-muted-foreground px-1">
                <span>#</span>
                <span>Product</span>
                <span>Qty</span>
                <span>Unit Price (Rs.)</span>
                <span className="text-right">Line Total</span>
                <span />
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={item.id}
                    className="grid grid-cols-[30px_1fr_90px_110px_100px_32px] gap-2 items-center rounded-lg border bg-muted/30 px-2 py-2"
                  >
                    <span className="text-xs text-muted-foreground text-center">{idx + 1}</span>

                    {/* Product dropdown — catalog + inventory merged */}
                    <Select value={item.product} onValueChange={(v) => updateItem(item.id, "product", v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-xs">Catalog</SelectLabel>
                          {CATALOG_ITEMS.map(({ name, price }) => (
                            <SelectItem key={name} value={name}>
                              {name}&nbsp;&nbsp;<span className="text-muted-foreground text-xs">Rs. {price}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {allProducts.filter(p => !(p.name in CATALOG)).length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-xs">Inventory</SelectLabel>
                            {allProducts.filter(p => !(p.name in CATALOG)).map(p => (
                              <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Qty */}
                    <Input className="h-8 text-sm text-center" placeholder="0"
                      value={item.qty === 0 ? "" : item.qty.toString()}
                      onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                      inputMode="numeric" />

                    {/* Unit price */}
                    <Input className="h-8 text-sm" placeholder="0.00"
                      value={item.unitPrice === 0 ? "" : item.unitPrice.toString()}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      inputMode="numeric" />

                    {/* Line total */}
                    <span className="text-right text-sm font-semibold">
                      {(item.qty * item.unitPrice).toLocaleString()}
                    </span>

                    <button type="button" onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors">
                      <MinusCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Discount + Totals */}
              <div className="mt-4 space-y-2">
                {/* Discount row */}
                <div className="flex items-center justify-end gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Discount %</span>
                  <Input
                    className="h-8 w-24 text-sm text-right"
                    placeholder="0"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="numeric"
                  />
                </div>

                {/* Totals box */}
                <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Discount ({discountPct}%)</span>
                      <span>− Rs. {discountAmt.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-1.5">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">Rs. {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update Order" : "Create Order"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Order Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details — {viewingOrder?.id}</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer</span><p className="font-medium mt-0.5">{viewingOrder.customer}</p></div>
                <div><span className="text-muted-foreground">Date</span><p className="font-medium mt-0.5">{viewingOrder.date}</p></div>
                <div><span className="text-muted-foreground">Status</span>
                  <div className="mt-0.5"><Badge variant={statusColors[viewingOrder.status] ?? "outline"}>{viewingOrder.status}</Badge></div>
                </div>
                <div><span className="text-muted-foreground">Total</span><p className="font-bold text-primary mt-0.5">Rs. {viewingOrder.total.toLocaleString()}</p></div>
              </div>

              {viewingOrder.lineItems && viewingOrder.lineItems.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 text-muted-foreground">ITEMS</p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Unit Price</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingOrder.lineItems.map((item, i) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-3 py-2 font-medium">{item.product}</td>
                            <td className="px-3 py-2 text-center">{item.qty}</td>
                            <td className="px-3 py-2 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-semibold">Rs. {(item.qty * item.unitPrice).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            {viewingOrder && (
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => { setIsViewOpen(false); openIssueInvoice(viewingOrder); }}>
                <FileText className="h-4 w-4" /> Issue Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Issue Invoice Dialog ──────────────────────────────────────────── */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Issue Invoice
            </DialogTitle>
          </DialogHeader>
          {invoiceSource && (
            <div className="space-y-4 py-2">
              {/* Order summary */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-medium">{invoiceSource.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{invoiceSource.customer}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issue Date</span><span className="font-medium">{invoiceSource.date}</span></div>
              </div>

              {/* Discount field */}
              <div className="grid gap-1.5">
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Discount (%)
                </Label>
                <Input
                  placeholder="0 — leave blank for no discount"
                  value={invDiscountPct}
                  onChange={(e) => setInvDiscountPct(e.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="numeric"
                  className="h-10"
                />
              </div>

              {/* Totals breakdown */}
              <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>Rs. {invSubtotal.toLocaleString()}</span>
                </div>
                {invDiscountAmt > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount ({invDiscountPct}%)</span>
                    <span>− Rs. {invDiscountAmt.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold border-t pt-1.5 text-base">
                  <span>Total</span>
                  <span className="text-primary">Rs. {invTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} />
              </div>

              <div className="grid gap-1.5">
                <Label>Invoice Status</Label>
                <Select value={invStatus} onValueChange={setInvStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Pending", "Paid", "Overdue"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsInvoiceOpen(false)}>Cancel</Button>
            <Button variant="outline" className="w-full sm:w-auto gap-2"
              onClick={() => handleIssueInvoice(false)}>
              <FileText className="h-4 w-4" /> Save Invoice
            </Button>
            <Button className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleIssueInvoice(true)}>
              <Download className="h-4 w-4" /> Save & Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Orders;
