"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { LaunchOffer, Locale } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { bs, getDict } from "@/lib/i18n";
import { BOX_PHOTOS } from "@/lib/media";

/** Fired to open the inquiry funnel with a box already chosen. */
export const INQUIRE_EVENT = "dcf:inquire";
export type InquireDetail = { kind: "bundle" | "steak" | "question" | "event"; key?: string };

/** Small line icons for the grill extras. */
function ExtraIcon({ slug }: { slug: string }) {
  const p = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (slug === "carbon" || slug === "kit-encendido")
    return (
      <svg {...p}>
        <path d="M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 11.5c0-1.6.8-2.6 1.6-3.4.2 1.4.9 2.2 1.8 2.6C11 8 11 5.5 12 3Z" />
        <path d="M5 20h14M7 17h10" />
      </svg>
    );
  if (slug === "llajua" || slug === "aji-locoto")
    return (
      <svg {...p}>
        <path d="M14 6c3 0 5 2 5 4 0 6-7 10-12 10-1.5 0-2-1-1-2 3-1.5 5-4 5-8 0-2.2 1-4 3-4Z" />
        <path d="M14 6c0-1.5.5-2.5 2-3" />
      </svg>
    );
  if (slug === "chimichurri")
    return (
      <svg {...p}>
        <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
        <path d="M5 19 13 11" />
      </svg>
    );
  if (slug === "sal-en-escamas")
    return (
      <svg {...p}>
        <path d="M8 9h8l-1 11H9L8 9Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        <path d="M11 4.5h.01M13 4.5h.01M12 3h.01" />
      </svg>
    );
  return (
    <svg {...p}>
      <rect x="4" y="7" width="16" height="13" rx="1" />
      <path d="M4 11h16M12 7v13" />
    </svg>
  );
}

export default function BoxCard({ o, locale }: { o: LaunchOffer; locale: Locale }) {
  const d = getDict(locale).boxes;
  const { add, setOpen } = useCart();
  const { getProduct } = useCatalog();
  const [added, setAdded] = useState(false);
  // Launch price only applies while the owner has the offer switched on.
  const price = o.active && o.launch_price ? o.launch_price : o.regular_value ?? 0;
  const saving = o.active && o.launch_price && o.regular_value ? o.regular_value - o.launch_price : 0;
  const photo = BOX_PHOTOS[o.key];

  const rows = (o.items ?? []).map((it) => {
    const p = getProduct(it.product);
    const name = p?.name[locale] ?? it.product;
    const isCut = !!it.est_kg || !!p?.cut;
    const qty = it.est_kg ? `${it.est_kg.toString().replace(".", locale === "es" ? "," : ".")} kg` : it.units && it.units > 1 ? `×${it.units}` : "";
    return { slug: it.product, name, qty, isCut };
  });
  const cuts = rows.filter((r) => r.isCut);
  const extras = rows.filter((r) => !r.isCut);

  return (
    <article className="card group flex h-full flex-col overflow-hidden">
      <div className="velvet relative aspect-[4/3] overflow-hidden">
        {photo && <Image src={photo.src} alt={o.name[locale]} fill sizes="(min-width:1280px) 31vw, (min-width:768px) 48vw, 100vw" className="object-cover transition duration-[1.4s] group-hover:scale-110" />}
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/10 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {o.serves && <span className="bg-noir/80 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-champagne backdrop-blur">{o.serves[locale]}</span>}
          {o.active && o.limit?.numbered && (
            <span className="bg-noir/80 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-champagne">
              {d.limited} · {o.limit.units}
            </span>
          )}
        </div>
        {saving > 0 && (
          <span className="absolute right-4 top-4 bg-burgundy px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-bone">
            {d.save} {bs(saving)}
          </span>
        )}
        <h3 className="h-display absolute inset-x-5 bottom-4 text-2xl md:text-3xl">{o.name[locale]}</h3>
      </div>

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <p className="font-serif text-lg leading-relaxed text-steel">{o.pitch[locale]}</p>

        {cuts.length > 0 && (
          <>
            <p className="label mb-2 mt-6">{d.cuts}</p>
            <ul className="divide-y divide-champagne/10 border-y border-champagne/10 text-sm">
              {cuts.map((c) => (
                <li key={c.slug} className="flex items-baseline justify-between gap-4 py-2">
                  <span className="text-bone">{c.name}</span>
                  <span className="font-display tabular-nums text-champagne">{c.qty}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {extras.length > 0 && (
          <>
            <p className="label mb-2 mt-5">{d.forFire}</p>
            <div className="flex flex-wrap gap-1.5">
              {extras.map((x) => (
                <span key={x.slug} className="inline-flex items-center gap-1.5 border border-champagne/20 px-2.5 py-1 text-[0.72rem] text-steel">
                  <span className="text-champagne">
                    <ExtraIcon slug={x.slug} />
                  </span>
                  {x.name}
                  {x.qty && <span className="text-ash">{x.qty}</span>}
                </span>
              ))}
            </div>
          </>
        )}
        {o.includes_extra && <p className="mt-4 text-xs text-ash">✦ {o.includes_extra[locale]}</p>}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
          <div>
            {saving > 0 && <p className="text-sm text-ash line-through">{bs(o.regular_value!)}</p>}
            <p className="font-display text-3xl text-champagne">{bs(price)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#consulta"
              onClick={() => window.dispatchEvent(new CustomEvent<InquireDetail>(INQUIRE_EVENT, { detail: { kind: "bundle", key: o.key } }))}
              className="text-[0.7rem] uppercase tracking-[0.2em] text-champagne underline-offset-4 hover:text-bone hover:underline"
            >
              {d.custom}
            </a>
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
                  pick: { box: o.key },
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
      </div>
    </article>
  );
}
