const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("urmart_token");
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Request failed");
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (name: string, email: string, password: string, phone?: string) =>
      request("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, phone }) }),
    me: () => request("/api/auth/me"),
  },

  // ── Users ─────────────────────────────────────────────────────
  users: {
    updateProfile: (data: { name: string; phone?: string }) =>
      request("/api/users/profile", { method: "PUT", body: JSON.stringify(data) }),
    changePassword: (old_password: string, new_password: string) =>
      request("/api/users/change-password", { method: "PUT", body: JSON.stringify({ old_password, new_password }) }),
  },

  // ── Addresses ─────────────────────────────────────────────────
  addresses: {
    list: () => request("/api/addresses"),
    add: (data: AddressInput) =>
      request("/api/addresses", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/api/addresses/${id}`, { method: "DELETE" }),
    setDefault: (id: string) =>
      request(`/api/addresses/${id}/default`, { method: "PUT" }),
  },

  // ── Categories ────────────────────────────────────────────────
  categories: {
    list: () => request("/api/categories"),
  },

  // ── Products ──────────────────────────────────────────────────
  products: {
    list: (params?: ProductParams) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.search) q.set("search", params.search);
      if (params?.sort) q.set("sort", params.sort);
      if (params?.page) q.set("page", String(params.page));
      if (params?.per_page) q.set("per_page", String(params.per_page));
      return request(`/api/products?${q}`);
    },
    get: (id: string) => request(`/api/products/${id}`),
    featured: () => request("/api/products/featured"),
    trending: () => request("/api/products/trending"),
    addReview: (pid: string, rating: number, comment: string) =>
      request(`/api/products/${pid}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) }),
  },

  // ── Cart ──────────────────────────────────────────────────────
  cart: {
    get: () => request("/api/cart"),
    add: (product_id: string, qty = 1) =>
      request("/api/cart", { method: "POST", body: JSON.stringify({ product_id, qty }) }),
    update: (item_id: string, qty: number) =>
      request(`/api/cart/${item_id}`, { method: "PUT", body: JSON.stringify({ qty }) }),
    remove: (item_id: string) =>
      request(`/api/cart/${item_id}`, { method: "DELETE" }),
    clear: () => request("/api/cart/clear", { method: "DELETE" }),
    sync: (items: Array<{ product_id: string; qty: number }>) =>
      request("/api/cart/sync", { method: "POST", body: JSON.stringify({ items }) }),
  },

  // ── Wishlist ──────────────────────────────────────────────────
  wishlist: {
    get: () => request("/api/wishlist"),
    toggle: (pid: string) => request(`/api/wishlist/${pid}`, { method: "POST" }),
  },

  // ── Coupons ───────────────────────────────────────────────────
  coupons: {
    apply: (code: string, subtotal: number) =>
      request("/api/coupons/apply", { method: "POST", body: JSON.stringify({ code, subtotal }) }),
  },

  // ── Orders ────────────────────────────────────────────────────
  orders: {
    place: (data: OrderInput) =>
      request("/api/orders", { method: "POST", body: JSON.stringify(data) }),
    list: () => request("/api/orders"),
    get: (id: string) => request(`/api/orders/${id}`),
  },

  // ── Admin ─────────────────────────────────────────────────────
  admin: {
    stats: () => request("/api/admin/stats"),
    users: () => request("/api/admin/users"),
    products: {
      list: () => request("/api/admin/products"),
      add: (data: unknown) => request("/api/admin/products", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: unknown) =>
        request(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      delete: (id: string) => request(`/api/admin/products/${id}`, { method: "DELETE" }),
    },
    orders: {
      list: (status?: string) => request(`/api/admin/orders${status ? `?status=${status}` : ""}`),
      updateStatus: (id: string, status: string) =>
        request(`/api/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
    },
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  avatar?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category?: Category;
  emoji: string;
  brand: string;
  weight: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  qty: number;
  product_id: string;
  name: string;
  emoji: string;
  weight: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  brand: string;
  added_at: string;
}

export interface CartData {
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  loyalty_discount: number;
  total: number;
  count: number;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: number;
  created_at: string;
}

export interface AddressInput {
  label?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  emoji: string;
  weight: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  user_id: string;
  address_line: string;
  city: string;
  pincode: string;
  phone: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  user_name?: string;
  user_email?: string;
}

export interface OrderInput {
  address: {
    line1: string;
    city: string;
    pincode: string;
    phone: string;
  };
  payment_method: string;
  coupon_code?: string;
  notes?: string;
}

export interface ProductParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}
