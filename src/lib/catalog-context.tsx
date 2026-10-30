"use client";

import { createContext, useContext, useMemo } from "react";
import { cutProductsOf, visibleProducts, type Catalog, type Product } from "./catalog";

type Ctx = Catalog & {
  visible: Product[];
  cuts: Product[];
  getProduct: (slug: string) => Product | undefined;
};

const CatalogCtx = createContext<Ctx | null>(null);

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const value = useMemo(() => {
    const visible = visibleProducts(catalog);
    return { ...catalog, visible, cuts: cutProductsOf(catalog), getProduct: (s: string) => visible.find((p) => p.slug === s) };
  }, [catalog]);
  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

export function useCatalog() {
  const c = useContext(CatalogCtx);
  if (!c) throw new Error("useCatalog must be used inside CatalogProvider");
  return c;
}
