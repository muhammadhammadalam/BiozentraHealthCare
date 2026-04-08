import { useState } from "react";
import { Plus, Package, ShoppingCart, Users, Receipt, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

type QuickActionType = "product" | "order" | "customer" | "invoice" | null;

export function QuickActions() {
  const [actionType, setActionType] = useState<QuickActionType>(null);
  const { addProduct, addOrder, addCustomer, addInvoice, customers } = useData();
  const { addNotification } = useNotifications();

  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Tablets",
    stock: 0,
    price: 0,
  });

  const [orderForm, setOrderForm] = useState({
    customer: "",
    items: 1,
    total: 0,
    status: "Pending",
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    orders: 0,
    totalSpent: 0,
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customer: "",
    amount: 0,
    status: "Pending",
  });

  const handleSave = () => {
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    switch (actionType) {
      case "product":
        if (!productForm.name) {
          toast.error("Product name is required");
          return;
        }
        addProduct(productForm);
        addNotification({
          title: "Product Added",
          message: `${productForm.name} has been added to inventory`,
          type: "success",
        });
        toast.success("Product added successfully!");
        setProductForm({ name: "", category: "Tablets", stock: 0, price: 0 });
        break;

      case "order":
        if (!orderForm.customer) {
          toast.error("Customer is required");
          return;
        }
        addOrder({ ...orderForm, date: today });
        addNotification({
          title: "New Order Created",
          message: `Order for ${orderForm.customer} - Rs. ${orderForm.total.toLocaleString()}`,
          type: "success",
        });
        toast.success("Order created successfully!");
        setOrderForm({ customer: "", items: 1, total: 0, status: "Pending" });
        break;

      case "customer":
        if (!customerForm.name || !customerForm.email) {
          toast.error("Name and email are required");
          return;
        }
        addCustomer(customerForm);
        addNotification({
          title: "Customer Added",
          message: `${customerForm.name} has been added to contacts`,
          type: "success",
        });
        toast.success("Customer added successfully!");
        setCustomerForm({
          name: "",
          email: "",
          phone: "",
          address: "",
          orders: 0,
          totalSpent: 0,
        });
        break;

      case "invoice":
        if (!invoiceForm.customer) {
          toast.error("Customer is required");
          return;
        }
        addInvoice({
          ...invoiceForm,
          date: today,
          dueDate,
        });
        addNotification({
          title: "Invoice Created",
          message: `Invoice for ${invoiceForm.customer} - Rs. ${invoiceForm.amount.toLocaleString()}`,
          type: "success",
        });
        toast.success("Invoice created successfully!");
        setInvoiceForm({ customer: "", amount: 0, status: "Pending" });
        break;
    }
    setActionType(null);
  };

  const quickActions = [
    {
      type: "product" as const,
      icon: Package,
      label: "Add Product",
      color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    },
    {
      type: "order" as const,
      icon: ShoppingCart,
      label: "New Order",
      color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    },
    {
      type: "customer" as const,
      icon: Users,
      label: "Add Customer",
      color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    },
    {
      type: "invoice" as const,
      icon: Receipt,
      label: "Create Invoice",
      color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${action.color}`}
              onClick={() => setActionType(action.type)}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </div>

      <Dialog open={actionType !== null} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Add:{" "}
              {actionType === "product"
                ? "Product"
                : actionType === "order"
                ? "Order"
                : actionType === "customer"
                ? "Customer"
                : "Invoice"}
            </DialogTitle>
          </DialogHeader>

          {actionType === "product" && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Product Name</Label>
                <Input
                  placeholder="Enter product name"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={productForm.category}
                    onValueChange={(value) =>
                      setProductForm({ ...productForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tablets">Tablets</SelectItem>
                      <SelectItem value="Capsules">Capsules</SelectItem>
                      <SelectItem value="Syrups">Syrups</SelectItem>
                      <SelectItem value="Injections">Injections</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Stock</Label>
                  <Input
                    type="text" inputMode="numeric"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Price (Rs.)</Label>
                <Input
                  type="text" inputMode="numeric"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          )}

          {actionType === "order" && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select
                  value={orderForm.customer}
                  onValueChange={(value) =>
                    setOrderForm({ ...orderForm, customer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Items</Label>
                  <Input
                    type="text" inputMode="numeric"
                    value={orderForm.items}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, items: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Total (Rs.)</Label>
                  <Input
                    type="text" inputMode="numeric"
                    value={orderForm.total}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, total: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {actionType === "customer" && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  placeholder="Customer name"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  placeholder="Phone number"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  placeholder="Address"
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, address: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {actionType === "invoice" && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select
                  value={invoiceForm.customer}
                  onValueChange={(value) =>
                    setInvoiceForm({ ...invoiceForm, customer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Amount (Rs.)</Label>
                <Input
                  type="text" inputMode="numeric"
                  value={invoiceForm.amount}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
