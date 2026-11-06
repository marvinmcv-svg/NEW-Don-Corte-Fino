"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fromPrice, type Locale, type Product } from "@/lib/catalog";
import { bs, getDict } from "@/lib/i18n";
import { productPhoto } from "@/lib/media";
import BuyPanel from "./BuyPanel";

/** Bottom sheet (mobile) / side dialog (desktop) to pick grade, thickness or weight and add straight from a card. */
export default function QuickAdd({ p, locale, open, onClose }: { p: Product; locale: Locale; open: boolean; onClose: () => void }) {
  const d = getDict(locale).store;
  const [mounted, setMounted] = useState(false);
  const photo = productPhoto(p);
  const price = fromPrice(p);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={p.name[locale]}
            data-lenis-prevent
            className="fixed inset-x-0 bottom-0 z-[71] max-h-[88svh] overflow-y-auto overscroll-contain border-t border-champagne/15 bg-charcoal md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:border-l md:border-t-0"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-champagne/10 bg-charcoal/95 px-5 py-4 backdrop-blur">
              {photo && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                  <Image src={photo.main.src} alt="" fill sizes="56px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="h-display truncate text-lg">{p.name[locale]}</p>
                <p className="text-xs text-ash">
                  {price.perKg && `${d.from} `}
                  <span className="text-champagne">{bs(price.amount)}</span>
                  {price.perKg && d.perKg}
                </p>
              </div>
              <button onClick={onClose} className="flex h-10 w-10 items-center justify-center text-2xl leading-none text-ash hover:text-bone" aria-label="Close">
                ×
              </button>
            </div>
            <div className="px-5 py-6">
              <BuyPanel p={p} locale={locale} compact onAdded={onClose} />
              <Link href={`/${locale}/cortes/${p.slug}`} onClick={onClose} className="mt-6 block text-center text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-ash hover:text-champagne">
                {d.view} →
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
