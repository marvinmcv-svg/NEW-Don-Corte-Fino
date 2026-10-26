"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { getProduct, type LaunchOffer, type Locale } from "@/lib/catalog";
import { bs, getDict } from "@/lib/i18n";
import { BOX_PHOTOS } from "@/lib/media";

export default function BoxCard({ o, locale }: { o: LaunchOffer; locale: Locale }) {
  const d = getDict(locale).boxes;
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState(false);
  // Launch price only applies while the owner has the offer switched on.
  const price = o.active && o.launch_price ? o.launch_price : o.regular_value ?? 0;

  const items = (o.items ?? []).map((it) => {
    const p = getProduct(it.product);
    const qty = it.est_kg ? `${it.est_kg} kg` : `×${it.units}`;
    return { slug: it.product, label: `${p?.name[locale] ?? it.product} · ${qty}` };
  });

  return (
    <article className="card group grid overflow-hidden md:grid-cols-[0.9fr_1.1fr]">
      <div className="velvet relative min-h-80 overflow-hidden">
        {BOX_PHOTOS[o.key] && (
          <Image src={BOX_PHOTOS[o.key].src} alt={o.name[locale]} fill sizes="(min-width:1024px) 22vw, 100vw" className="object-cover transition duration-[1.4s] group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-noir/50 to-transparent" />
        {o.active && o.limit?.numbered && (
          <span className="absolute left-4 top-4 bg-noir/80 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-champagne">
            {d.limited} · {o.limit.units}
          </span>
        )}
      </div>
      <div className="flex flex-col p-7">
        <h3 className="h-display text-2xl">{o.name[locale]}</h3>
        <p className="mt-3 font-serif text-lg leading-relaxed text-steel">{o.pitch[locale]}</p>
        <p className="label mt-6 mb-3">{d.includes}</p>
        <ul className="space-y-1.5 text-sm text-ash">
          {items.map((it) => (
            <li key={it.slug} className="flex gap-2">
              <span className="text-wine">✦</span>
              {it.label}
            </li>
          ))}
          {o.includes_extra && (
            <li className="flex gap-2">
              <span className="text-wine">✦</span>
              {o.includes_extra[locale]}
            </li>
          )}
        </ul>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
          <div>
            {o.active && o.regular_value && <p className="text-sm text-ash line-through">{bs(o.regular_value)}</p>}
            <p className="font-display text-3xl text-champagne">{bs(price)}</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              add({
                id: `box-${o.key}`,
                slug: o.key,
                name: o.name,
                details: o.includes_extra ? [o.includes_extra] : [],
                qty: 1,
                unitPrice: price,
                estKg: null,
                estimated: false,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
              setTimeout(() => setOpen(true), 350);
            }}
          >
            {added ? "✓" : d.add}
          </button>
        </div>
      </div>
    </article>
  );
}
