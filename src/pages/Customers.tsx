import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Mail, Phone, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";

interface CustomerFormData {
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  totalSpent: number;
}

const emptyCustomer: CustomerFormData = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  location: "",
  orders: 0,
  totalSpent: 0,
};

const Customers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyCustomer);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (customerId?: number) => {
    if (customerId != null) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setEditingId(customerId);
        setFormData({
          name: customer.name,
          contact: customer.contact,
          email: customer.email,
          phone: customer.phone,
          location: customer.location,
          orders: customer.orders,
          totalSpent: customer.totalSpent,
        });
      }
    } else {
      setEditingId(null);
      setFormData(emptyCustomer);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(emptyCustomer);
  };

  const handleSave = () => {
    if (!formData.name || !formData.contact || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (editingId != null) {
      updateCustomer(editingId, formData);
      toast.success("Customer updated successfully");
    } else {
      addCustomer(formData);
      toast.success("Customer added successfully");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    deleteCustomer(id);
    toast.success("Customer deleted");
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Customers</h1>
          <p className="mt-1 text-muted-foreground">Manage your customer relationships</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
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

      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="h-14 w-14 opacity-30 mb-3" />
          <p className="font-medium text-lg">No customers yet</p>
          <p className="text-sm mt-1">Add your first customer to get started.</p>
        </div>
      ) : (
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
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">{customer.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{customer.contact}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(customer.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{customer.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="font-semibold">{customer.orders}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="font-semibold">Rs. {customer.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Company / Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Al-Shifa Pharmacy"
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
                placeholder="+92 3XX XXXXXXX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">City / Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Karachi, Lahore, Dubai"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId != null ? "Update" : "Add"} Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Customers;
