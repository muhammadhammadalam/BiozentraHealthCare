import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Building2, Phone, Mail, Package, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { api, ApiSupplier } from "@/lib/api";

interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  products: number;
  status: string;
  lastOrder: string;
}

const initialSuppliers: Supplier[] = [
  { id: 1, name: "PharmaChem Industries", contact: "Vikram Singh", email: "vikram@pharmachem.in", phone: "+91 98111 22334", products: 12, status: "Active", lastOrder: "2026-01-02" },
  { id: 2, name: "MediRaw Supplies", contact: "Anita Desai", email: "anita@mediraw.in", phone: "+91 87222 33445", products: 8, status: "Active", lastOrder: "2025-12-28" },
  { id: 3, name: "BioSource Labs", contact: "Karan Mehta", email: "karan@biosource.in", phone: "+91 76333 44556", products: 15, status: "Active", lastOrder: "2026-01-01" },
  { id: 4, name: "ChemPure Pvt Ltd", contact: "Sunita Rao", email: "sunita@chempure.in", phone: "+91 65444 55667", products: 6, status: "Inactive", lastOrder: "2025-11-15" },
  { id: 5, name: "GlobalPharma", contact: "Rohit Jain", email: "rohit@globalpharma.in", phone: "+91 54555 66778", products: 20, status: "Active", lastOrder: "2026-01-03" },
];

const emptySupplier: Omit<Supplier, "id"> = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  products: 0,
  status: "Active",
  lastOrder: new Date().toISOString().split("T")[0],
};

const SUPPLIERS_KEY = "biozentra-suppliers";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const stored = localStorage.getItem(SUPPLIERS_KEY);
      return stored ? JSON.parse(stored) : initialSuppliers;
    } catch { return initialSuppliers; }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Omit<Supplier, "id">>(emptySupplier);

  useEffect(() => {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await api.suppliers.list();
        if (data && data.length > 0) {
          // Map API response (snake_case) to frontend (camelCase)
          const mapped = data.map(s => ({
            ...s,
            lastOrder: s.last_order,
          }));
          setSuppliers(mapped);
          localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(mapped));
        }
      } catch {
        // Fallback to localStorage on API failure
      }
    };
    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ name: supplier.name, contact: supplier.contact, email: supplier.email, phone: supplier.phone, products: supplier.products, status: supplier.status, lastOrder: supplier.lastOrder });
    } else {
      setEditingSupplier(null);
      setFormData(emptySupplier);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setFormData(emptySupplier);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.contact || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (editingSupplier) {
      try {
        // Map camelCase to snake_case for API
        const apiPayload = {
          ...formData,
          last_order: formData.lastOrder,
        };
        const updated = await api.suppliers.update(editingSupplier.id, apiPayload);
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === editingSupplier.id
              ? { ...formData, id: updated.id, lastOrder: updated.last_order }
              : s
          )
        );
        toast.success("Supplier updated successfully");
      } catch {
        // Fallback: update local state only
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingSupplier.id ? { ...formData, id: editingSupplier.id } : s))
        );
        toast.success("Supplier updated (offline)");
      }
    } else {
      try {
        const apiPayload = {
          ...formData,
          last_order: formData.lastOrder,
        };
        const created = await api.suppliers.create(apiPayload);
        const newSupplier: Supplier = {
          ...formData,
          id: created.id,
          lastOrder: created.last_order,
        };
        setSuppliers((prev) => [...prev, newSupplier]);
        toast.success("Supplier added successfully");
      } catch {
        // Fallback: use temp ID
        const newSupplier: Supplier = {
          ...formData,
          id: Math.max(0, ...suppliers.map((s) => s.id)) + 1,
        };
        setSuppliers((prev) => [...prev, newSupplier]);
        toast.success("Supplier added (offline)");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.suppliers.delete(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Supplier deleted successfully");
    } catch {
      // Fallback: delete from local state
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Supplier deleted (offline)");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Suppliers</h1>
          <p className="mt-1 text-muted-foreground">Manage your supplier network</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
          <Button size="sm" className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </motion.div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier, i) => (
          <motion.div
            key={supplier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-accent/50 text-accent-foreground font-semibold">
                        <Building2 className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{supplier.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={supplier.status === "Active" ? "default" : "secondary"}>
                      {supplier.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{supplier.products} products supplied</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">Last Order: {supplier.lastOrder}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredSuppliers.length === 0 && (
          <p className="col-span-3 text-center text-muted-foreground py-8">No suppliers found.</p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Contact Person *</Label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label>Products Supplied</Label>
              <Input
                type="number"
                value={formData.products}
                onChange={(e) => setFormData({ ...formData, products: parseInt(e.target.value) || 0 })}
                placeholder="Number of products"
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Last Order Date</Label>
              <Input
                type="date"
                value={formData.lastOrder}
                onChange={(e) => setFormData({ ...formData, lastOrder: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingSupplier ? "Update" : "Add"} Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Suppliers;
