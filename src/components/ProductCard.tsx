"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { badgeFor, fromPrice, type Locale, type Product } from "@/lib/catalog";
import { shapeFor } from "@/lib/cuts";
import { bs, getDict } from "@/lib/i18n";
import { productPhoto } from "@/lib/media";
import CutArt from "./CutArt";

export default function ProductCard({ p, locale, large = false }: { p: Product; locale: Locale; large?: boolean }) {
  const d = getDict(locale).store;
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState(false);
  const isCut = p.sale_type === "portion" || p.sale_type === "weight";
  const price = fromPrice(p);
  const badge = badgeFor(p.badge, locale);
  const soldOut = p.status === "sold_out";
  const photo = productPhoto(p.slug);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 200, damping: 20 });

  const quickAdd = () => {
    add({
      id: p.slug,
      slug: p.slug,
      name: p.name,
      details: p.description ? [p.description] : [],
      qty: 1,
      unitPrice: p.price ?? 0,
      estKg: null,
      estimated: false,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    setTimeout(() => setOpen(true), 350);
  };

  const href = `/${locale}/cortes/${p.slug}`;
  const art = (
    <div className={`velvet relative ${large ? "aspect-[4/5]" : "aspect-square"} overflow-hidden`}>
      {!photo && <div className="marbling absolute inset-0 opacity-[0.07]" />}
      {photo ? (
        <>
          <Image
            src={photo.main.src}
            alt={p.name[locale]}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover transition duration-[1.4s] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-110"
          />
          {photo.alt && (
            <Image
              src={photo.alt.src}
              alt=""
              fill
              sizes="(min-width:1024px) 25vw, 50vw"
              className="object-cover opacity-0 transition duration-700 group-hover:opacity-100"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-noir/60 via-transparent to-transparent" />
        </>
      ) : (
        <motion.div className="absolute inset-0" whileHover={{ scale: 1.06 }} transition={{ duration: 0.8 }}>
          <CutArt seed={p.slug} shape={shapeFor(p)} className="h-full w-full p-4" />
        </motion.div>
      )}
      <div className="sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-champagne/15 to-transparent opacity-0 group-hover:opacity-100" />
      {badge && <span className="absolute left-4 top-4 bg-noir/80 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-champagne">{badge}</span>}
      {soldOut && <span className="absolute right-4 top-4 bg-wine px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em]">{d.soldOut}</span>}
    </div>
  );

  return (
    <motion.article
      className="card group h-full transition-shadow duration-500 hover:shadow-[0_0_0_1px_rgba(126,44,62,0.7),0_30px_60px_-20px_rgba(126,44,62,0.55)]"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
    >
      {isCut ? <Link href={href} data-cursor={locale === "es" ? "Ver" : "View"}>{art}</Link> : art}
      <div className="flex flex-col gap-3 p-5">
        <div>
          {isCut ? (
            <Link href={href} className={`h-display block ${large ? "text-xl" : "text-base"} hover:text-champagne`}>
              {p.name[locale]}
            </Link>
          ) : (
            <h3 className={`h-display ${large ? "text-xl" : "text-base"}`}>{p.name[locale]}</h3>
          )}
          {p.description && <p className="mt-1 text-xs text-ash">{p.description[locale]}</p>}
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-steel">
            {price.perKg && <span className="mr-1 text-[0.65rem] uppercase tracking-[0.2em] text-ash">{d.from}</span>}
            <span className="font-display text-lg text-champagne">{bs(price.amount)}</span>
            {price.perKg && <span className="text-xs text-ash">{d.perKg}</span>}
          </p>
          {isCut ? (
            <Link href={href} className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-bone transition group-hover:text-champagne">
              {d.view} →
            </Link>
          ) : (
            <button
              disabled={soldOut}
              onClick={quickAdd}
              className="border border-champagne/30 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-bone transition hover:border-wine hover:bg-burgundy disabled:opacity-40"
            >
              {added ? `✓ ${d.added}` : `+ ${d.add}`}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
