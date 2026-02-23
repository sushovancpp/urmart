"use client";
import React, {
  createContext, useContext, useReducer, useEffect, useCallback, useRef
} from "react";
import { api, User, CartData, CartItem } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AppState {
  user: User | null;
  token: string | null;
  cart: CartData | null;
  cartOpen: boolean;
  loading: boolean;
}

type Action =
  | { type: "SET_USER"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "SET_CART"; payload: CartData }
  | { type: "TOGGLE_CART"; payload?: boolean }
  | { type: "SET_LOADING"; payload: boolean };

interface AppContextType extends AppState {
  login:     (email: string, password: string) => Promise<void>;
  register:  (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout:    () => void;
  fetchCart: () => Promise<void>;
  addToCart: (product_id: string, qty?: number) => Promise<void>;
  updateCartItem: (item_id: string, qty: number) => Promise<void>;
  removeFromCart: (item_id: string) => Promise<void>;
  openCart:  () => void;
  closeCart: () => void;
  cartCount: number;
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case "LOGOUT":
      return { ...state, user: null, token: null, cart: null, loading: false };
    case "SET_CART":
      return { ...state, cart: action.payload };
    case "TOGGLE_CART":
      return { ...state, cartOpen: action.payload ?? !state.cartOpen };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: null,
    cart: null,
    cartOpen: false,
    loading: true,
  });

  const fetchingCart = useRef(false);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("urmart_token");
    if (token) {
      api.auth.me()
        .then((res: unknown) => {
          const r = res as { data: User };
          dispatch({ type: "SET_USER", payload: { user: r.data, token } });
        })
        .catch(() => {
          localStorage.removeItem("urmart_token");
          dispatch({ type: "SET_LOADING", payload: false });
        });
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Fetch cart when user logs in
  useEffect(() => {
    if (state.user) fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.id]);

  const fetchCart = useCallback(async () => {
    if (!state.user || fetchingCart.current) return;
    fetchingCart.current = true;
    try {
      const res = await api.cart.get() as { data: CartData };
      dispatch({ type: "SET_CART", payload: res.data });
    } catch {
      // ignore
    } finally {
      fetchingCart.current = false;
    }
  }, [state.user]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password) as { data: { token: string; user: User } };
    localStorage.setItem("urmart_token", res.data.token);
    dispatch({ type: "SET_USER", payload: { user: res.data.user, token: res.data.token } });
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await api.auth.register(name, email, password, phone) as { data: { token: string; user: User } };
    localStorage.setItem("urmart_token", res.data.token);
    dispatch({ type: "SET_USER", payload: { user: res.data.user, token: res.data.token } });
  };

  const logout = () => {
    localStorage.removeItem("urmart_token");
    dispatch({ type: "LOGOUT" });
  };

  const addToCart = async (product_id: string, qty = 1) => {
    if (!state.user) throw new Error("Please login to add to cart");
    await api.cart.add(product_id, qty);
    await fetchCart();
    dispatch({ type: "TOGGLE_CART", payload: true });
  };

  const updateCartItem = async (item_id: string, qty: number) => {
    await api.cart.update(item_id, qty);
    await fetchCart();
  };

  const removeFromCart = async (item_id: string) => {
    await api.cart.remove(item_id);
    await fetchCart();
  };

  const cartCount = state.cart?.count ?? 0;

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      fetchCart,
      addToCart,
      updateCartItem,
      removeFromCart,
      openCart:  () => dispatch({ type: "TOGGLE_CART", payload: true }),
      closeCart: () => dispatch({ type: "TOGGLE_CART", payload: false }),
      cartCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
