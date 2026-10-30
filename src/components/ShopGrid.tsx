"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Locale, Product } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { getDict } from "@/lib/i18n";
import ProductCard from "./ProductCard";

type Filter = "all" | Product["sale_type"];

export default function ShopGrid({ locale }: { locale: Locale }) {
  const d = getDict(locale).store;
  const [f, setF] = useState<Filter>("all");
  const { visible } = useCatalog();
  const list = visible.filter((p) => f === "all" || p.sale_type === f);
  const filters: [Filter, string][] = [["all", d.filterAll], ...(Object.entries(d.filters) as [Filter, string][])];

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mt-12 flex gap-2 overflow-x-auto bg-charcoal/90 px-4 py-4 backdrop-blur md:top-20 md:mx-0 md:px-0">
        {filters.map(([k, label]) => (
          <button key={k} onClick={() => setF(k)} className={`chip shrink-0 uppercase tracking-[0.2em] ${f === k ? "chip-on" : ""}`}>
            {label}
          </button>
        ))}
      </div>
      <motion.div layout className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.div key={p.slug} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}>
              <ProductCard p={p} locale={locale} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
