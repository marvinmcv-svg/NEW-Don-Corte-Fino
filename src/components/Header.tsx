"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import type { Locale } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";

export default function Header({ locale, nav, banner }: { locale: Locale; nav: Dict["nav"]; banner?: string }) {
  const pathname = usePathname();
  const { count, setOpen, bump } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  const swap = (l: Locale) => pathname.replace(/^\/(es|en)(?=\/|$)/, `/${l}`) || `/${l}`;
  const links = [
    { href: `/${locale}/cortes`, label: nav.cuts },
    { href: `/${locale}/tienda`, label: nav.shop },
    { href: `/${locale}#cajas`, label: nav.boxes },
    { href: `/${locale}#entregas`, label: nav.delivery },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || menu ? "border-b border-champagne/10 bg-noir/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      {banner && <div className="bg-burgundy px-4 py-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-bone">{banner}</div>}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
        <Link href={`/${locale}`} className="group flex items-center gap-3" aria-label="Don Corte Fino">
          <Image src="/brand/mark.webp" alt="" width={44} height={44} className="h-9 w-9 md:h-11 md:w-11" priority />
          <span className="leading-none">
            <span className="block font-display text-[0.6rem] tracking-[0.4em] text-wine">DON</span>
            <span className="block font-display text-base tracking-[0.12em] text-bone md:text-lg">CORTE FINO</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group relative text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-steel transition hover:text-bone"
            >
              {l.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-champagne transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex text-[0.65rem] font-semibold tracking-[0.2em]">
            {(["es", "en"] as Locale[]).map((l, i) => (
              <span key={l} className="flex items-center">
                {i > 0 && <span className="px-1.5 text-ash/50">|</span>}
                <Link href={swap(l)} className={l === locale ? "text-champagne" : "text-ash hover:text-bone"} hrefLang={l} onClick={() => (document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000`)}>
                  {l.toUpperCase()}
                </Link>
              </span>
            ))}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center text-bone transition hover:text-champagne"
            aria-label={nav.cart}
          >
            <motion.svg
              key={bump}
              animate={bump ? { scale: [1, 1.3, 0.9, 1], rotate: [0, -8, 6, 0] } : {}}
              transition={{ duration: 0.5 }}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </motion.svg>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-wine px-1 text-[0.6rem] font-bold text-bone"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
            <span className={`h-px w-6 bg-bone transition ${menu ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-bone transition ${menu ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 pb-6">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="border-b border-champagne/10 py-4 font-display text-xl tracking-[0.1em] text-bone">
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
