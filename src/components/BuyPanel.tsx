"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { PREP_LABELS, type L10n, type Locale, type Product } from "@/lib/catalog";
import { bs, getDict } from "@/lib/i18n";

const kgLabel = (kg: number): L10n => ({ es: `${kg.toLocaleString("es-BO")} kg`, en: `${kg} kg` });

export default function BuyPanel({ p, locale }: { p: Product; locale: Locale }) {
  const d = getDict(locale).buy;
  const { add, setOpen } = useCart();
  const grades = p.grades ?? [];
  const [grade, setGrade] = useState(grades[0]?.key);
  const [portion, setPortion] = useState(0);
  const min = p.min_qty ?? 0.5;
  const step = p.step_qty ?? 0.25;
  const [kg, setKg] = useState(Math.max(min, p.slug === "pecho" ? 2 : 1));
  const [prep, setPrep] = useState(p.prep_options?.[0]);
  const [qty, setQty] = useState(p.sale_type === "portion" ? 2 : 1);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const g = grades.find((x) => x.key === grade);
  const perKg = g?.price_per_kg ?? p.price_per_kg ?? 0;
  const portionObj = p.portions?.[portion];

  const { unitPrice, estKg } = useMemo(() => {
    if (p.sale_type === "portion" && portionObj) return { unitPrice: perKg * portionObj.est_kg, estKg: portionObj.est_kg };
    if (p.sale_type === "weight") return { unitPrice: perKg * kg, estKg: kg };
    return { unitPrice: p.price ?? 0, estKg: null };
  }, [p, perKg, portionObj, kg]);

  const kgSteps = useMemo(() => {
    const out: number[] = [];
    for (let v = min; v <= Math.max(min * 4, 5) + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
    return out;
  }, [min, step]);

  const submit = () => {
    const details: L10n[] = [];
    if (g) details.push(g.label);
    if (p.sale_type === "portion" && portionObj) details.push({ es: `${portionObj.label.es} (~${portionObj.est_kg} kg c/u)`, en: `${portionObj.label.en} (~${portionObj.est_kg} kg each)` });
    if (p.sale_type === "weight") details.push(kgLabel(kg));
    if (prep && PREP_LABELS[prep]) details.push(PREP_LABELS[prep]);
    const id = [p.slug, grade, portion, p.sale_type === "weight" ? kg : "", prep, note.trim()].join("|");
    add({
      id,
      slug: p.slug,
      name: p.name,
      details,
      qty: p.sale_type === "weight" ? 1 : qty,
      unitPrice,
      estKg,
      estimated: p.sale_type === "portion" || p.sale_type === "weight",
      note: note.trim() || undefined,
      pick: {
        grade,
        portion: p.sale_type === "portion" ? portion : undefined,
        kg: p.sale_type === "weight" ? kg : undefined,
        prep,
      },
    });
    setDone(true);
    setTimeout(() => setDone(false), 1500);
    setTimeout(() => setOpen(true), 400);
  };

  const total = unitPrice * (p.sale_type === "weight" ? 1 : qty);

  return (
    <div className="card space-y-6 p-6 md:p-7">
      {grades.length > 0 && (
        <fieldset>
          <legend className="label mb-3">{d.grade}</legend>
          <div className="grid grid-cols-2 gap-2">
            {grades.map((x) => (
              <button key={x.key} onClick={() => setGrade(x.key)} className={`chip text-left ${grade === x.key ? "chip-on" : ""}`}>
                <span className="block">{x.label[locale]}</span>
                <span className="mt-1 block text-[0.7rem] text-champagne">{bs(x.price_per_kg)}/kg</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {p.sale_type === "portion" && p.portions && (
        <fieldset>
          <legend className="label mb-3">{d.portion}</legend>
          <div className="flex flex-wrap gap-2">
            {p.portions.map((x, i) => (
              <button key={i} onClick={() => setPortion(i)} className={`chip ${portion === i ? "chip-on" : ""}`}>
                {x.label[locale]} · ~{Math.round(x.est_kg * 1000)} g
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {p.sale_type === "weight" && (
        <fieldset>
          <legend className="label mb-3">{d.weight}</legend>
          <div className="flex items-center gap-4">
            <button className="chip px-4 text-lg" onClick={() => setKg((v) => Math.max(min, Math.round((v - step) * 100) / 100))} aria-label="-">
              −
            </button>
            <span className="min-w-24 text-center font-display text-2xl text-bone">{kg.toLocaleString(locale === "es" ? "es-BO" : "en")} kg</span>
            <button className="chip px-4 text-lg" onClick={() => setKg((v) => Math.round((v + step) * 100) / 100)} aria-label="+">
              +
            </button>
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {kgSteps.filter((v, i) => i % Math.max(1, Math.round(0.5 / step)) === 0).slice(0, 7).map((v) => (
              <button key={v} onClick={() => setKg(v)} className={`chip shrink-0 ${kg === v ? "chip-on" : ""}`}>
                {v} kg
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {p.prep_options && p.prep_options.length > 1 && (
        <fieldset>
          <legend className="label mb-3">{d.prep}</legend>
          <div className="flex flex-wrap gap-2">
            {p.prep_options.map((x) => (
              <button key={x} onClick={() => setPrep(x)} className={`chip ${prep === x ? "chip-on" : ""}`}>
                {PREP_LABELS[x]?.[locale] ?? x}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {p.sale_type === "portion" && (
        <fieldset>
          <legend className="label mb-3">{d.qty}</legend>
          <div className="flex items-center gap-4">
            <button className="chip px-4 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-">
              −
            </button>
            <span className="w-8 text-center font-display text-2xl">{qty}</span>
            <button className="chip px-4 text-lg" onClick={() => setQty((q) => q + 1)} aria-label="+">
              +
            </button>
          </div>
        </fieldset>
      )}

      <label className="block">
        <span className="label mb-3 block">{d.note}</span>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={d.notePh} maxLength={140} />
      </label>

      <div className="gold-rule" />

      <div className="flex items-end justify-between">
        <span className="label">{d.est}</span>
        <span className="font-display text-3xl text-bone">~{bs(total)}</span>
      </div>
      <p className="-mt-3 text-xs leading-relaxed text-ash">{d.estNote}</p>
      <button onClick={submit} disabled={p.status === "sold_out"} className="btn-primary w-full disabled:opacity-40">
        {done ? "✓" : d.add}
      </button>
    </div>
  );
}
