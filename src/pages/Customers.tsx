import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Mail, Phone, MapPin, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, ApiCustomer } from "@/lib/api";

interface Customer {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  totalSpent: number;
}

const initialCustomers: Customer[] = [
  { id: 1, name: "City Pharmacy", contact: "Rajesh Kumar", email: "rajesh@citypharma.in", phone: "+91 98765 43210", location: "Mumbai", orders: 45, totalSpent: 125000 },
  { id: 2, name: "MediCare Plus", contact: "Priya Sharma", email: "priya@medicare.in", phone: "+91 87654 32109", location: "Delhi", orders: 32, totalSpent: 89000 },
  { id: 3, name: "HealthFirst Store", contact: "Amit Patel", email: "amit@healthfirst.in", phone: "+91 76543 21098", location: "Ahmedabad", orders: 28, totalSpent: 76500 },
  { id: 4, name: "Apollo Distributors", contact: "Suresh Reddy", email: "suresh@apollo.in", phone: "+91 65432 10987", location: "Hyderabad", orders: 67, totalSpent: 234000 },
  { id: 5, name: "Wellness Hub", contact: "Neha Gupta", email: "neha@wellnesshub.in", phone: "+91 54321 09876", location: "Bangalore", orders: 23, totalSpent: 54000 },
];

const emptyCustomer: Omit<Customer, 'id'> = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  location: "",
  orders: 0,
  totalSpent: 0,
};

const CUSTOMERS_KEY = "biozentra-customers";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOMERS_KEY);
      return stored ? JSON.parse(stored) : initialCustomers;
    } catch { return initialCustomers; }
  });

  useEffect(() => {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await api.customers.list();
        if (data && data.length > 0) {
          // Map API response (snake_case) to frontend (camelCase)
          const mapped = data.map(c => ({
            ...c,
            totalSpent: c.total_spent,
          }));
          setCustomers(mapped);
          localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(mapped));
        }
      } catch {
        // Fallback to localStorage on API failure
      }
    };
    loadCustomers();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>(emptyCustomer);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        location: customer.location,
        orders: customer.orders,
        totalSpent: customer.totalSpent,
      });
    } else {
      setEditingCustomer(null);
      setFormData(emptyCustomer);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData(emptyCustomer);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.contact || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingCustomer) {
      try {
        // Map camelCase to snake_case for API
        const apiPayload = {
          ...formData,
          total_spent: formData.totalSpent,
        };
        const updated = await api.customers.update(editingCustomer.id, apiPayload);
        setCustomers(customers.map(c =>
          c.id === editingCustomer.id
            ? { ...formData, id: updated.id, totalSpent: updated.total_spent }
            : c
        ));
        toast.success("Customer updated successfully");
      } catch {
        // Fallback: update local state only
        setCustomers(customers.map(c =>
          c.id === editingCustomer.id ? { ...formData, id: editingCustomer.id } : c
        ));
        toast.success("Customer updated (offline)");
      }
    } else {
      try {
        const apiPayload = {
          ...formData,
          total_spent: formData.totalSpent,
        };
        const created = await api.customers.create(apiPayload);
        const newCustomer: Customer = {
          ...formData,
          id: created.id,
          totalSpent: created.total_spent,
        };
        setCustomers([...customers, newCustomer]);
        toast.success("Customer added successfully");
      } catch {
        // Fallback: use temp ID
        const newCustomer: Customer = {
          ...formData,
          id: Math.max(0, ...customers.map(c => c.id)) + 1,
        };
        setCustomers([...customers, newCustomer]);
        toast.success("Customer added (offline)");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.customers.delete(id);
      setCustomers(customers.filter(c => c.id !== id));
      toast.success("Customer deleted successfully");
    } catch {
      // Fallback: delete from local state
      setCustomers(customers.filter(c => c.id !== id));
      toast.success("Customer deleted (offline)");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Customers</h1>
          <p className="mt-1 text-muted-foreground">Manage your customer relationships</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
          <Button size="sm" className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </motion.div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base">{customer.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{customer.contact}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(customer)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{customer.location}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-semibold">{customer.orders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="font-semibold">Rs. {customer.totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Person *</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingCustomer ? "Update" : "Add"} Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Customers;
