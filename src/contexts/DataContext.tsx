import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: string;
}

export interface LineItem {
  id: string;
  product: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customer: string;
  products: string;
  total: number;
  status: string;
  date: string;
  lineItems?: LineItem[];
}

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
  isLoading: boolean;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Map DB rows (snake_case) → TypeScript models (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(row: any): Order {
  return {
    id: row.id,
    customer: row.customer,
    products: row.products || "",
    total: row.total || 0,
    status: row.status || "Pending",
    date: row.date || "",
    lineItems: row.line_items ?? undefined,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact || "",
    email: row.email || "",
    phone: row.phone || "",
    location: row.location || "",
    orders: row.orders || 0,
    totalSpent: row.total_spent || 0,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    customer: row.customer,
    date: row.date || "",
    dueDate: row.due_date || "",
    amount: row.amount || 0,
    status: row.status || "Pending",
  };
}

function makeOrderId(existing: Order[]): string {
  const year = new Date().getFullYear();
  if (isSupabaseConfigured) {
    // Use timestamp suffix to avoid collisions across multiple users
    return `ORD-${year}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  }
  const max = existing.filter(o => o.id.startsWith(`ORD-${year}`))
    .reduce((m, o) => Math.max(m, parseInt(o.id.split("-")[2]) || 0), 0);
  return `ORD-${year}-${String(max + 1).padStart(3, "0")}`;
}

function makeInvoiceId(existing: Invoice[]): string {
  const year = new Date().getFullYear();
  if (isSupabaseConfigured) {
    return `INV-${year}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  }
  const max = existing.filter(i => i.id.startsWith(`INV-${year}`))
    .reduce((m, i) => Math.max(m, parseInt(i.id.split("-")[2]) || 0), 0);
  return `INV-${year}-${String(max + 1).padStart(3, "0")}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // In Supabase mode start empty; data arrives from the first fetch.
  // In localStorage mode, seed from storage immediately.
  const [products, setProducts] = useState<Product[]>(() =>
    isSupabaseConfigured ? [] : loadFromStorage(STORAGE_KEYS.products, [])
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    isSupabaseConfigured ? [] : loadFromStorage(STORAGE_KEYS.orders, [])
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    isSupabaseConfigured ? [] : loadFromStorage(STORAGE_KEYS.customers, [])
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    isSupabaseConfigured ? [] : loadFromStorage(STORAGE_KEYS.invoices, [])
  );
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  // ── Supabase: initial fetch + realtime subscriptions ──────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const fetchAll = async () => {
      setIsLoading(true);
      const [p, o, c, inv] = await Promise.all([
        supabase.from("products").select("*").order("id"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("*").order("id"),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      ]);
      if (p.data) setProducts(p.data as Product[]);
      if (o.data) setOrders(o.data.map(mapOrder));
      if (c.data) setCustomers(c.data.map(mapCustomer));
      if (inv.data) setInvoices(inv.data.map(mapInvoice));
      setIsLoading(false);
    };

    fetchAll();

    // Re-fetch whenever any table changes (works for all users in real time)
    const channel = supabase
      .channel("biozentra-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── localStorage persistence (only when NOT using Supabase) ───────────────
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers)); }, [customers]);
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices)); }, [invoices]);

  // ─── PRODUCT CRUD ──────────────────────────────────────────────────────────
  const addProduct = (product: Omit<Product, "id" | "status">) => {
    const status = getProductStatus(product.stock);
    if (isSupabaseConfigured && supabase) {
      supabase.from("products")
        .insert([{ name: product.name, category: product.category, stock: product.stock, price: product.price, status }])
        .then(({ error }) => { if (error) console.error("addProduct:", error); });
    } else {
      setProducts(prev => {
        const newItem: Product = { ...product, status, id: prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1 };
        return [...prev, newItem];
      });
    }
  };

  const updateProduct = (id: number, product: Partial<Product>) => {
    const extra = product.stock !== undefined ? { status: getProductStatus(product.stock) } : {};
    if (isSupabaseConfigured && supabase) {
      supabase.from("products").update({ ...product, ...extra }).eq("id", id)
        .then(({ error }) => { if (error) console.error("updateProduct:", error); });
    } else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product, ...extra } : p));
    }
  };

  const deleteProduct = (id: number) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from("products").delete().eq("id", id)
        .then(({ error }) => { if (error) console.error("deleteProduct:", error); });
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // ─── ORDER CRUD ────────────────────────────────────────────────────────────
  const addOrder = (order: Omit<Order, "id">) => {
    const id = makeOrderId(orders);
    const newOrder: Order = { ...order, id };
    if (isSupabaseConfigured && supabase) {
      supabase.from("orders")
        .insert([{ id, customer: order.customer, products: order.products, total: order.total, status: order.status, date: order.date, line_items: order.lineItems ?? null }])
        .then(({ error }) => { if (error) console.error("addOrder:", error); });
    } else {
      setOrders(prev => [newOrder, ...prev]);
    }
  };

  const updateOrder = (id: string, order: Partial<Order>) => {
    const { lineItems, ...rest } = order;
    const dbUpdate = { ...rest, ...(lineItems !== undefined ? { line_items: lineItems } : {}) };
    if (isSupabaseConfigured && supabase) {
      supabase.from("orders").update(dbUpdate).eq("id", id)
        .then(({ error }) => { if (error) console.error("updateOrder:", error); });
    } else {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...order } : o));
    }
  };

  const deleteOrder = (id: string) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from("orders").delete().eq("id", id)
        .then(({ error }) => { if (error) console.error("deleteOrder:", error); });
    } else {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  // ─── CUSTOMER CRUD ─────────────────────────────────────────────────────────
  const addCustomer = (customer: Omit<Customer, "id">) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from("customers")
        .insert([{ name: customer.name, contact: customer.contact, email: customer.email, phone: customer.phone, location: customer.location, orders: customer.orders || 0, total_spent: customer.totalSpent || 0 }])
        .then(({ error }) => { if (error) console.error("addCustomer:", error); });
    } else {
      setCustomers(prev => {
        const newItem: Customer = { ...customer, id: prev.length > 0 ? Math.max(...prev.map(c => c.id)) + 1 : 1 };
        return [...prev, newItem];
      });
    }
  };

  const updateCustomer = (id: number, customer: Partial<Customer>) => {
    const { totalSpent, ...rest } = customer;
    const dbUpdate = { ...rest, ...(totalSpent !== undefined ? { total_spent: totalSpent } : {}) };
    if (isSupabaseConfigured && supabase) {
      supabase.from("customers").update(dbUpdate).eq("id", id)
        .then(({ error }) => { if (error) console.error("updateCustomer:", error); });
    } else {
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customer } : c));
    }
  };

  const deleteCustomer = (id: number) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from("customers").delete().eq("id", id)
        .then(({ error }) => { if (error) console.error("deleteCustomer:", error); });
    } else {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  // ─── INVOICE CRUD ──────────────────────────────────────────────────────────
  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const id = makeInvoiceId(invoices);
    const newInvoice: Invoice = { ...invoice, id };
    if (isSupabaseConfigured && supabase) {
      supabase.from("invoices")
        .insert([{ id, customer: invoice.customer, date: invoice.date, due_date: invoice.dueDate, amount: invoice.amount, status: invoice.status }])
        .then(({ error }) => { if (error) console.error("addInvoice:", error); });
    } else {
      setInvoices(prev => [newInvoice, ...prev]);
    }
  };

  const updateInvoice = (id: string, invoice: Partial<Invoice>) => {
    const { dueDate, ...rest } = invoice;
    const dbUpdate = { ...rest, ...(dueDate !== undefined ? { due_date: dueDate } : {}) };
    if (isSupabaseConfigured && supabase) {
      supabase.from("invoices").update(dbUpdate).eq("id", id)
        .then(({ error }) => { if (error) console.error("updateInvoice:", error); });
    } else {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoice } : i));
    }
  };

  const deleteInvoice = (id: string) => {
    if (isSupabaseConfigured && supabase) {
      supabase.from("invoices").delete().eq("id", id)
        .then(({ error }) => { if (error) console.error("deleteInvoice:", error); });
    } else {
      setInvoices(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <DataContext.Provider value={{
      products, orders, customers, invoices, isLoading,
      setProducts, setOrders, setCustomers, setInvoices,
      addProduct, updateProduct, deleteProduct,
      addOrder, updateOrder, deleteOrder,
      addCustomer, updateCustomer, deleteCustomer,
      addInvoice, updateInvoice, deleteInvoice,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
};
