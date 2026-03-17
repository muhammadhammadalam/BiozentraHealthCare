import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Product types
export interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: string;
}

// Order types
export interface Order {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: string;
}

// Customer types
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  orders: number;
  totalSpent: number;
}

// Invoice types
export interface Invoice {
  id: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface DataContextType {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  invoices: Invoice[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  addProduct: (product: Omit<Product, "id" | "status">) => void;
  updateProduct: (id: number, product: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  addOrder: (order: Omit<Order, "id">) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addCustomer: (customer: Omit<Customer, "id">) => void;
  updateCustomer: (id: number, customer: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  addInvoice: (invoice: Omit<Invoice, "id">) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial data
const initialProducts: Product[] = [
  { id: 1, name: "Paracetamol 500mg", category: "Tablets", stock: 500, price: 45, status: "In Stock" },
  { id: 2, name: "Amoxicillin 250mg", category: "Capsules", stock: 200, price: 120, status: "In Stock" },
  { id: 3, name: "Omeprazole 20mg", category: "Capsules", stock: 150, price: 85, status: "In Stock" },
  { id: 4, name: "Cetirizine 10mg", category: "Tablets", stock: 300, price: 35, status: "In Stock" },
  { id: 5, name: "Ibuprofen 400mg", category: "Tablets", stock: 15, price: 55, status: "Low Stock" },
  { id: 6, name: "Metformin 500mg", category: "Tablets", stock: 0, price: 65, status: "Out of Stock" },
  { id: 7, name: "Azithromycin 500mg", category: "Tablets", stock: 100, price: 180, status: "In Stock" },
  { id: 8, name: "Pantoprazole 40mg", category: "Tablets", stock: 250, price: 95, status: "In Stock" },
];

const initialOrders: Order[] = [
  { id: "ORD-2024-001", customer: "City Medical Store", date: "2024-01-15", items: 5, total: 12500, status: "Delivered" },
  { id: "ORD-2024-002", customer: "HealthCare Pharmacy", date: "2024-01-14", items: 3, total: 8500, status: "Processing" },
  { id: "ORD-2024-003", customer: "MedPlus Distributors", date: "2024-01-13", items: 8, total: 24000, status: "Pending" },
  { id: "ORD-2024-004", customer: "Apollo Pharmacy", date: "2024-01-12", items: 4, total: 15000, status: "Delivered" },
  { id: "ORD-2024-005", customer: "Wellness Mart", date: "2024-01-11", items: 6, total: 18500, status: "Cancelled" },
];

const initialCustomers: Customer[] = [
  { id: 1, name: "City Medical Store", email: "city@medical.com", phone: "+91 98765 43210", address: "123 Main Street, Mumbai", orders: 45, totalSpent: 125000 },
  { id: 2, name: "HealthCare Pharmacy", email: "info@healthcare.com", phone: "+91 98765 43211", address: "456 Park Avenue, Delhi", orders: 32, totalSpent: 89000 },
  { id: 3, name: "MedPlus Distributors", email: "sales@medplus.com", phone: "+91 98765 43212", address: "789 Ring Road, Bangalore", orders: 28, totalSpent: 156000 },
  { id: 4, name: "Apollo Pharmacy", email: "contact@apollo.com", phone: "+91 98765 43213", address: "321 Lake View, Chennai", orders: 56, totalSpent: 234000 },
  { id: 5, name: "Wellness Mart", email: "hello@wellness.com", phone: "+91 98765 43214", address: "654 Hill Station, Pune", orders: 19, totalSpent: 67000 },
];

const initialInvoices: Invoice[] = [
  { id: "INV-2024-001", customer: "City Medical Store", date: "2024-01-15", dueDate: "2024-02-15", amount: 12500, status: "Paid" },
  { id: "INV-2024-002", customer: "HealthCare Pharmacy", date: "2024-01-14", dueDate: "2024-02-14", amount: 8500, status: "Pending" },
  { id: "INV-2024-003", customer: "MedPlus Distributors", date: "2024-01-13", dueDate: "2024-02-13", amount: 24000, status: "Pending" },
  { id: "INV-2024-004", customer: "Apollo Pharmacy", date: "2024-01-12", dueDate: "2024-02-12", amount: 15000, status: "Paid" },
  { id: "INV-2024-005", customer: "Wellness Mart", date: "2024-01-11", dueDate: "2024-01-25", amount: 18500, status: "Overdue" },
];

const getProductStatus = (stock: number): string => {
  if (stock === 0) return "Out of Stock";
  if (stock < 20) return "Low Stock";
  return "In Stock";
};

const STORAGE_KEYS = {
  products: "biozentra-ctx-products",
  orders: "biozentra-ctx-orders",
  customers: "biozentra-ctx-customers",
  invoices: "biozentra-ctx-invoices",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage(STORAGE_KEYS.products, initialProducts));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage(STORAGE_KEYS.orders, initialOrders));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage(STORAGE_KEYS.customers, initialCustomers));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage(STORAGE_KEYS.invoices, initialInvoices));

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices)); }, [invoices]);

  // Product CRUD
  const addProduct = (product: Omit<Product, "id" | "status">) => {
    const newProduct: Product = {
      ...product,
      id: Math.max(...products.map((p) => p.id)) + 1,
      status: getProductStatus(product.stock),
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id: number, product: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...product };
          if (product.stock !== undefined) {
            updated.status = getProductStatus(product.stock);
          }
          return updated;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Order CRUD
  const addOrder = (order: Omit<Order, "id">) => {
    const orderNum = orders.length + 1;
    const newOrder: Order = {
      ...order,
      id: `ORD-2024-${String(orderNum).padStart(3, "0")}`,
    };
    setOrders((prev) => [...prev, newOrder]);
  };

  const updateOrder = (id: string, order: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...order } : o)));
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Customer CRUD
  const addCustomer = (customer: Omit<Customer, "id">) => {
    const newCustomer: Customer = {
      ...customer,
      id: Math.max(...customers.map((c) => c.id)) + 1,
    };
    setCustomers((prev) => [...prev, newCustomer]);
  };

  const updateCustomer = (id: number, customer: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...customer } : c)));
  };

  const deleteCustomer = (id: number) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Invoice CRUD
  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const invoiceNum = invoices.length + 1;
    const newInvoice: Invoice = {
      ...invoice,
      id: `INV-2024-${String(invoiceNum).padStart(3, "0")}`,
    };
    setInvoices((prev) => [...prev, newInvoice]);
  };

  const updateInvoice = (id: string, invoice: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...invoice } : i)));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        products,
        orders,
        customers,
        invoices,
        setProducts,
        setOrders,
        setCustomers,
        setInvoices,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrder,
        deleteOrder,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addInvoice,
        updateInvoice,
        deleteInvoice,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
