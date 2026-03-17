// Central API client — all backend calls go through here.
// Falls back gracefully if the backend is unreachable.

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";
const TOKEN_KEY = "biozentra-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Types (mirrors frontend interfaces) ──────────────────────────────────────

export interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
}

export interface ApiInventory {
  id: number;
  name: string;
  product_id: number | null;
  batch: string;
  quantity: number;
  max_stock: number;
  expiry: string;
  status: string;
}

export interface ApiOrder {
  id: string;
  customer: string;
  products: string;
  total: number;
  status: string;
  date: string;
}

export interface ApiCustomer {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  total_spent: number;
}

export interface ApiInvoice {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  due_date: string;
}

export interface ApiSupplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  products: number;
  status: string;
  last_order: string;
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ access: string; refresh: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string, email?: string, name?: string) =>
      request<{ message: string }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, email, name }),
      }),
  },

  products: {
    list: () => request<ApiProduct[]>("/api/v1/products/"),
    create: (data: Omit<ApiProduct, "id">) =>
      request<ApiProduct>("/api/v1/products/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Omit<ApiProduct, "id">>) =>
      request<ApiProduct>(`/api/v1/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/api/v1/products/${id}`, { method: "DELETE" }),
  },

  inventory: {
    list: () => request<ApiInventory[]>("/api/v1/inventory/"),
    create: (data: Omit<ApiInventory, "id">) =>
      request<ApiInventory>("/api/v1/inventory/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Omit<ApiInventory, "id">>) =>
      request<ApiInventory>(`/api/v1/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/api/v1/inventory/${id}`, { method: "DELETE" }),
  },

  orders: {
    list: () => request<ApiOrder[]>("/api/v1/orders/"),
    create: (data: Omit<ApiOrder, "id"> & { id?: string }) =>
      request<ApiOrder>("/api/v1/orders/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Omit<ApiOrder, "id">>) =>
      request<ApiOrder>(`/api/v1/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/v1/orders/${id}`, { method: "DELETE" }),
  },

  customers: {
    list: () => request<ApiCustomer[]>("/api/v1/customers/"),
    create: (data: Omit<ApiCustomer, "id">) =>
      request<ApiCustomer>("/api/v1/customers/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Omit<ApiCustomer, "id">>) =>
      request<ApiCustomer>(`/api/v1/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/api/v1/customers/${id}`, { method: "DELETE" }),
  },

  invoices: {
    list: () => request<ApiInvoice[]>("/api/v1/invoices/"),
    create: (data: Omit<ApiInvoice, "id"> & { id?: string }) =>
      request<ApiInvoice>("/api/v1/invoices/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Omit<ApiInvoice, "id">>) =>
      request<ApiInvoice>(`/api/v1/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/v1/invoices/${id}`, { method: "DELETE" }),
  },

  suppliers: {
    list: () => request<ApiSupplier[]>("/api/v1/suppliers/"),
    create: (data: Omit<ApiSupplier, "id">) =>
      request<ApiSupplier>("/api/v1/suppliers/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Omit<ApiSupplier, "id">>) =>
      request<ApiSupplier>(`/api/v1/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/api/v1/suppliers/${id}`, { method: "DELETE" }),
  },
};
