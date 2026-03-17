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
  products: string;
  total: number;
  status: string;
  date: string;
}

// Customer types
export interface Customer {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
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

export const getProductStatus = (stock: number): string => {
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

const generateOrderId = (existingOrders: Order[]): string => {
  const year = new Date().getFullYear();
  const yearOrders = existingOrders.filter(o => o.id.includes(`ORD-${year}`));
  const maxNum = yearOrders.length > 0
    ? Math.max(...yearOrders.map(o => parseInt(o.id.split('-')[2]) || 0))
    : 0;
  return `ORD-${year}-${String(maxNum + 1).padStart(3, '0')}`;
};

const generateInvoiceId = (existingInvoices: Invoice[]): string => {
  const year = new Date().getFullYear();
  const yearInvoices = existingInvoices.filter(i => i.id.includes(`INV-${year}`));
  const maxNum = yearInvoices.length > 0
    ? Math.max(...yearInvoices.map(i => parseInt(i.id.split('-')[2]) || 0))
    : 0;
  return `INV-${year}-${String(maxNum + 1).padStart(3, '0')}`;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage(STORAGE_KEYS.products, []));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage(STORAGE_KEYS.orders, []));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage(STORAGE_KEYS.customers, []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage(STORAGE_KEYS.invoices, []));

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices)); }, [invoices]);

  // Product CRUD
  const addProduct = (product: Omit<Product, "id" | "status">) => {
    const newProduct: Product = {
      ...product,
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
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
    setOrders((prev) => {
      const newOrder: Order = { ...order, id: generateOrderId(prev) };
      return [newOrder, ...prev];
    });
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
      id: customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1,
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
    setInvoices((prev) => {
      const newInvoice: Invoice = { ...invoice, id: generateInvoiceId(prev) };
      return [newInvoice, ...prev];
    });
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
        products, orders, customers, invoices,
        setProducts, setOrders, setCustomers, setInvoices,
        addProduct, updateProduct, deleteProduct,
        addOrder, updateOrder, deleteOrder,
        addCustomer, updateCustomer, deleteCustomer,
        addInvoice, updateInvoice, deleteInvoice,
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
