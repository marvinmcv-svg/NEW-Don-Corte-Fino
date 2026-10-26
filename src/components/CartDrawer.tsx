"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { getProduct, type Locale } from "@/lib/catalog";
import { shapeFor } from "@/lib/cuts";
import { bs, getDict } from "@/lib/i18n";
import CutArt from "./CutArt";
import { productPhoto } from "@/lib/media";

export default function CartDrawer({ locale }: { locale: Locale }) {
  const { items, open, setOpen, setQty, remove, subtotal, add } = useCart();
  const d = getDict(locale).cart;
  const chimi = getProduct("chimichurri");
  const hasChimi = items.some((i) => i.slug === "chimichurri");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label={d.title}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-champagne/10 bg-charcoal"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-champagne/10 px-6 py-5">
              <h2 className="h-display text-xl">{d.title}</h2>
              <button onClick={() => setOpen(false)} className="text-2xl leading-none text-ash hover:text-bone" aria-label="Close">
                ×
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
                <p className="font-serif text-2xl text-steel">{d.empty}</p>
                <Link href={`/${locale}/cortes`} onClick={() => setOpen(false)} className="btn-primary">
                  {d.emptyCta}
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-champagne/10 overflow-y-auto px-6">
                  {items.map((i) => {
                    const p = getProduct(i.slug);
                    return (
                      <motion.li layout key={i.id} className="flex gap-4 py-5">
                        <div className="velvet relative h-20 w-20 shrink-0 overflow-hidden">
                          {productPhoto(i.slug) ? (
                            <Image src={productPhoto(i.slug)!.main.src} alt="" fill sizes="80px" className="object-cover" />
                          ) : (
                            <CutArt seed={i.slug} shape={p ? shapeFor(p) : "steak"} className="h-full w-full" dense={0.6} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm tracking-wide text-bone">{i.name[locale]}</p>
                          <p className="mt-1 text-xs leading-relaxed text-ash">{i.details.map((x) => x[locale]).join(" · ")}</p>
                          {i.note && <p className="mt-1 text-xs italic text-ash">“{i.note}”</p>}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center border border-champagne/20">
                              <button className="px-3 py-1 text-steel hover:text-bone" onClick={() => setQty(i.id, i.qty - 1)} aria-label="-">
                                −
                              </button>
                              <span className="w-6 text-center text-sm">{i.qty}</span>
                              <button className="px-3 py-1 text-steel hover:text-bone" onClick={() => setQty(i.id, i.qty + 1)} aria-label="+">
                                +
                              </button>
                            </div>
                            <span className="text-sm text-champagne">
                              {i.estimated && "~"}
                              {bs(i.unitPrice * i.qty)}
                            </span>
                          </div>
                          <button onClick={() => remove(i.id)} className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-ash hover:text-wine">
                            {d.remove}
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>

                <div className="border-t border-champagne/10 px-6 py-5">
                  {chimi && !hasChimi && (
                    <div className="mb-4 flex items-center justify-between gap-3 border border-dashed border-champagne/25 px-4 py-3 text-xs text-steel">
                      <span>
                        {d.upsell} <span className="text-champagne">{bs(chimi.price ?? 0)}</span>
                      </span>
                      <button
                        className="shrink-0 uppercase tracking-[0.2em] text-champagne hover:text-bone"
                        onClick={() =>
                          add({
                            id: "chimichurri",
                            slug: "chimichurri",
                            name: chimi.name,
                            details: chimi.description ? [chimi.description] : [],
                            qty: 1,
                            unitPrice: chimi.price ?? 0,
                            estKg: null,
                            estimated: false,
                          })
                        }
                      >
                        + {d.upsellAdd}
                      </button>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="label">{d.subtotal}</span>
                    <span className="font-display text-2xl text-bone">~{bs(subtotal)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ash">{d.why}</p>
                  <Link href={`/${locale}/checkout`} onClick={() => setOpen(false)} className="btn-primary mt-5 w-full">
                    {d.checkout}
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
