"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Locale } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { CUTS, PRIMALS, PRIMAL_ORDER, type PrimalKey } from "@/lib/cuts";
import { getDict } from "@/lib/i18n";

/** Stylised butcher's chart, side view facing left. */
export const PRIMAL_PATHS: Record<PrimalKey, string> = {
  chuck: "M122 78 L215 70 L215 160 L128 186 Q118 140 122 78 Z",
  rib: "M215 70 L298 67 L298 150 L215 160 Z",
  loin: "M298 67 L382 70 L382 118 L298 124 Z",
  tenderloin: "M298 124 L382 118 L382 147 L298 150 Z",
  rump: "M382 70 L452 76 L458 150 L382 147 Z",
  brisket: "M128 186 L215 160 L215 236 Q170 240 150 228 Q132 214 128 186 Z",
  plate: "M215 160 L298 150 L298 240 L215 236 Z",
  flank: "M298 150 L382 147 L386 234 L298 240 Z",
};

const OUTLINE = {
  head: "M122 78 Q100 70 84 74 L60 66 Q50 58 44 64 Q52 74 56 84 L34 112 Q22 126 30 140 Q40 152 58 150 Q78 150 92 166 Q108 180 128 186 Q118 140 122 78 Z",
  round: "M452 76 Q500 82 516 112 Q526 150 512 196 Q500 226 470 234 L386 234 L382 147 L458 150 Z",
  legs: "M150 228 L148 296 L170 296 L176 238 Z M196 238 L194 296 L214 296 L215 236 Z M410 234 L406 296 L428 296 L436 234 Z M462 234 L466 296 L488 296 L486 226 Z",
  tail: "M516 112 Q540 140 532 210 Q530 222 538 230",
  horn: "M60 66 Q58 46 74 40",
};

export default function CowMap({ locale, active: fixed }: { locale: Locale; active?: PrimalKey | null }) {
  const d = getDict(locale).map;
  const [hover, setHover] = useState<PrimalKey | null>(fixed ?? "rib");
  const sel = fixed !== undefined ? fixed : hover;
  const { cuts } = useCatalog();
  const cutsIn = (k: PrimalKey) => cuts.filter((p) => p.cut && CUTS[p.cut]?.primal === k);
  const interactive = fixed === undefined;

  return (
    <div className={interactive ? "grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]" : ""}>
      <svg viewBox="0 30 560 280" className="w-full" role="group" aria-label={d.title}>
        <defs>
          <pattern id="mb" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M0 20 C15 10 30 30 60 18 M0 45 C20 38 35 55 60 44" stroke="#D6C5A7" strokeWidth=".5" fill="none" opacity=".5" />
          </pattern>
        </defs>
        <g fill="#1d1d1c" stroke="#D6C5A7" strokeOpacity=".35" strokeWidth="1">
          <path d={OUTLINE.head} />
          <path d={OUTLINE.round} />
          <path d={OUTLINE.legs} />
          <path d={OUTLINE.tail} fill="none" />
          <path d={OUTLINE.horn} fill="none" strokeWidth="3" strokeLinecap="round" />
        </g>
        {PRIMAL_ORDER.map((k) => {
          const on = sel === k;
          return (
            <g
              key={k}
              onMouseEnter={() => interactive && setHover(k)}
              onClick={() => interactive && setHover(k)}
              onFocus={() => interactive && setHover(k)}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? "button" : undefined}
              aria-label={PRIMALS[k][locale]}
              className={interactive ? "cursor-pointer outline-none" : ""}
            >
              <motion.path
                d={PRIMAL_PATHS[k]}
                initial={false}
                animate={{ fill: on ? "#7e2c3e" : "#2a2827", fillOpacity: on ? 0.95 : 0.9 }}
                transition={{ duration: 0.35 }}
                stroke="#D6C5A7"
                strokeOpacity={on ? 0.9 : 0.4}
                strokeWidth={on ? 1.5 : 1}
              />
              <path d={PRIMAL_PATHS[k]} fill="url(#mb)" opacity={on ? 0.5 : 0.15} pointerEvents="none" />
            </g>
          );
        })}
      </svg>

      {interactive && (
        <div className="min-h-64">
          <p className="label mb-4">{d.hint}</p>
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            {PRIMAL_ORDER.map((k) => (
              <button key={k} onClick={() => setHover(k)} className={`chip ${sel === k ? "chip-on" : ""}`}>
                {PRIMALS[k][locale]}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {sel && (
              <motion.div key={sel} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
                <h3 className="h-display text-3xl md:text-4xl">{PRIMALS[sel][locale]}</h3>
                <div className="gold-rule my-5" />
                {cutsIn(sel).length === 0 ? (
                  <p className="text-ash">{d.noCuts}</p>
                ) : (
                  <ul className="space-y-1">
                    {cutsIn(sel).map((p) => (
                      <li key={p.slug}>
                        <Link href={`/${locale}/cortes/${p.slug}`} className="group flex items-center justify-between border-b border-champagne/10 py-3 font-serif text-xl text-steel transition hover:text-bone">
                          {p.name[locale]}
                          <span className="text-xs uppercase tracking-[0.25em] text-champagne opacity-0 transition group-hover:opacity-100">{d.see} →</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
