"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { L10n } from "./catalog";

export type CartItem = {
  id: string;
  slug: string;
  name: L10n;
  /** Human-readable option lines, already in both languages. */
  details: L10n[];
  qty: number;
  /** Price of one unit of `qty` (one steak, one pack, or the whole weighed piece). */
  unitPrice: number;
  estKg: number | null;
  /** True when the price depends on the final weight. */
  estimated: boolean;
  note?: string;
  /** What was chosen, sent to place_order so the database can price it. */
  pick?: { grade?: string; portion?: number; kg?: number; prep?: string; box?: string };
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  bump: number;
  setOpen: (v: boolean) => void;
  add: (item: CartItem) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "dcf-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + item.qty } : i));
      return [...prev, item];
    });
    setBump((b) => b + 1);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => prev.flatMap((i) => (i.id !== id ? [i] : qty <= 0 ? [] : [{ ...i, qty }])));
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.unitPrice * i.qty, 0),
      open,
      bump,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, open, bump, add, setQty, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
