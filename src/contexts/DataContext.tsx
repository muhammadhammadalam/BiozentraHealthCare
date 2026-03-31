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
  discountPct?: number;
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
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
  discountPct?: number;
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
  addProduct: (product: Omit<Product, "id" | "status">) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addOrder: (order: Omit<Order, "id">) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, "id">) => Promise<void>;
  updateCustomer: (id: number, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id">) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
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
    total: Number(row.total) || 0,
    status: row.status || "Pending",
    date: row.date || "",
    lineItems: row.line_items ?? undefined,
    discountPct: row.discount_pct != null ? Number(row.discount_pct) : undefined,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomer(row: any): Customer {
  return {
    id: Number(row.id),
    name: row.name,
    contact: row.contact || "",
    phone: row.phone || "",
    location: row.location || row.city || "",
    orders: Number(row.orders) || 0,
    totalSpent: Number(row.total_spent) || 0,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): Product {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category || "",
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    status: row.status || getProductStatus(Number(row.stock) || 0),
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    customer: row.customer,
    date: row.date || "",
    dueDate: row.due_date || "",
    amount: Number(row.amount) || 0,
    status: row.status || "Pending",
    discountPct: row.discount_pct != null ? Number(row.discount_pct) : undefined,
  };
}

function makeOrderId(existing: Order[]): string {
  const year = new Date().getFullYear();
  if (isSupabaseConfigured) {
    return `ORD-${year}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }
  const max = existing.filter(o => o.id.startsWith(`ORD-${year}`))
    .reduce((m, o) => Math.max(m, parseInt(o.id.split("-")[2]) || 0), 0);
  return `ORD-${year}-${String(max + 1).padStart(3, "0")}`;
}

function makeInvoiceId(existing: Invoice[]): string {
  const year = new Date().getFullYear();
  if (isSupabaseConfigured) {
    return `INV-${year}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }
  const max = existing.filter(i => i.id.startsWith(`INV-${year}`))
    .reduce((m, i) => Math.max(m, parseInt(i.id.split("-")[2]) || 0), 0);
  return `INV-${year}-${String(max + 1).padStart(3, "0")}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
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

  // ── Supabase: initial fetch + realtime ────────────────────────────────────
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
      if (p.data)   setProducts(p.data.map(mapProduct));
      if (o.data)   setOrders(o.data.map(mapOrder));
      if (c.data)   setCustomers(c.data.map(mapCustomer));
      if (inv.data) setInvoices(inv.data.map(mapInvoice));
      setIsLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("biozentra-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── localStorage persistence ───────────────────────────────────────────────
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers)); }, [customers]);
  useEffect(() => { if (!isSupabaseConfigured) localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices)); }, [invoices]);

  // ─── PRODUCT CRUD ──────────────────────────────────────────────────────────
  const addProduct = async (product: Omit<Product, "id" | "status">) => {
    const status = getProductStatus(product.stock);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("products")
        .insert([{ name: product.name, category: product.category, stock: product.stock, price: product.price, status }])
        .select()
        .single();
      if (error) { console.error("addProduct:", error); throw error; }
      if (data) setProducts(prev => [...prev, mapProduct(data)]);
    } else {
      setProducts(prev => {
        const newId = prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1;
        return [...prev, { ...product, status, id: newId }];
      });
    }
  };

  const updateProduct = async (id: number, product: Partial<Product>) => {
    const extra = product.stock !== undefined ? { status: getProductStatus(product.stock) } : {};
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("products").update({ ...product, ...extra }).eq("id", id);
      if (error) { console.error("updateProduct:", error); throw error; }
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product, ...extra } : p));
    } else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product, ...extra } : p));
    }
  };

  const deleteProduct = async (id: number) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) { console.error("deleteProduct:", error); throw error; }
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // ─── ORDER CRUD ────────────────────────────────────────────────────────────
  const addOrder = async (order: Omit<Order, "id">) => {
    const id = makeOrderId(orders);
    const newOrder: Order = { ...order, id };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("orders").insert([{
        id,
        customer: order.customer,
        products: order.products,
        total: order.total,
        status: order.status,
        date: order.date,
        line_items: order.lineItems ?? [],
        discount_pct: order.discountPct ?? 0,
      }]);
      if (error) { console.error("addOrder:", error); throw error; }
      setOrders(prev => [newOrder, ...prev]);
    } else {
      setOrders(prev => [newOrder, ...prev]);
    }
  };

  const updateOrder = async (id: string, order: Partial<Order>) => {
    const { lineItems, discountPct, ...rest } = order;
    const dbUpdate = {
      ...rest,
      ...(lineItems    !== undefined ? { line_items:   lineItems    } : {}),
      ...(discountPct  !== undefined ? { discount_pct: discountPct  } : {}),
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("orders").update(dbUpdate).eq("id", id);
      if (error) { console.error("updateOrder:", error); throw error; }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...order } : o));
    } else {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...order } : o));
    }
  };

  const deleteOrder = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) { console.error("deleteOrder:", error); throw error; }
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  // ─── CUSTOMER CRUD ─────────────────────────────────────────────────────────
  const addCustomer = async (customer: Omit<Customer, "id">) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("customers").insert([{
        name: customer.name,
        contact: customer.contact,
        phone: customer.phone,
        location: customer.location,
        city: customer.location,
        orders: customer.orders || 0,
        total_spent: customer.totalSpent || 0,
      }]).select().single();
      if (error) { console.error("addCustomer:", error); throw error; }
      if (data) setCustomers(prev => [...prev, mapCustomer(data)]);
    } else {
      setCustomers(prev => {
        const newId = prev.length > 0 ? Math.max(...prev.map(c => c.id)) + 1 : 1;
        return [...prev, { ...customer, id: newId }];
      });
    }
  };

  const updateCustomer = async (id: number, customer: Partial<Customer>) => {
    const { totalSpent, location, ...rest } = customer;
    const dbUpdate = {
      ...rest,
      ...(totalSpent !== undefined ? { total_spent: totalSpent } : {}),
      ...(location !== undefined ? { location, city: location } : {}),
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("customers").update(dbUpdate).eq("id", id);
      if (error) { console.error("updateCustomer:", error); throw error; }
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customer } : c));
    } else {
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customer } : c));
    }
  };

  const deleteCustomer = async (id: number) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) { console.error("deleteCustomer:", error); throw error; }
      setCustomers(prev => prev.filter(c => c.id !== id));
    } else {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  // ─── INVOICE CRUD ──────────────────────────────────────────────────────────
  const addInvoice = async (invoice: Omit<Invoice, "id">) => {
    const id = makeInvoiceId(invoices);
    const newInvoice: Invoice = { ...invoice, id };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("invoices").insert([{
        id,
        customer: invoice.customer,
        date: invoice.date,
        due_date: invoice.dueDate,
        amount: invoice.amount,
        status: invoice.status,
        discount_pct: invoice.discountPct ?? 0,
      }]);
      if (error) { console.error("addInvoice:", error); throw error; }
      setInvoices(prev => [newInvoice, ...prev]);
    } else {
      setInvoices(prev => [newInvoice, ...prev]);
    }
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    const { dueDate, discountPct, ...rest } = invoice;
    const dbUpdate = {
      ...rest,
      ...(dueDate     !== undefined ? { due_date:     dueDate     } : {}),
      ...(discountPct !== undefined ? { discount_pct: discountPct } : {}),
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("invoices").update(dbUpdate).eq("id", id);
      if (error) { console.error("updateInvoice:", error); throw error; }
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoice } : i));
    } else {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoice } : i));
    }
  };

  const deleteInvoice = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) { console.error("deleteInvoice:", error); throw error; }
      setInvoices(prev => prev.filter(i => i.id !== id));
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
