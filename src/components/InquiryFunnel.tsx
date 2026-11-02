"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { INQUIRE_EVENT, type InquireDetail } from "@/components/BoxCard";
import type { Locale } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { bs } from "@/lib/i18n";
import { waLink } from "@/lib/order";

/**
 * A guided inquiry: what the customer is after → the details → who they are → send.
 * The phone on the right shows the WhatsApp message being written as they go, and the
 * green button opens WhatsApp with exactly that message addressed to the shop.
 */

type Kind = InquireDetail["kind"];
type Grade = "seleccion" | "reserva";
type CutPick = { kg: number; cm: string; grade: Grade };

const COPY = {
  es: {
    kicker: "Consultas y pedidos",
    title: "Arma tu pedido. Lo ves llegar a WhatsApp.",
    sub: "Elige lo que buscas, ajusta los detalles y envíalo con un toque. Te respondemos en minutos.",
    steps: ["Qué buscas", "Detalles", "Tus datos", "Enviar"],
    kinds: {
      bundle: { t: "Una caja de parrilla", d: "Parrilladas listas con carbón, llajua y chimichurri" },
      steak: { t: "Cortes y bifes", d: "Elige cortes, peso, grosor y línea" },
      event: { t: "Un asado o evento", d: "Cumpleaños, empresa o familia: te armamos la cantidad" },
      question: { t: "Tengo una consulta", d: "Envíos, pagos, cocción o lo que necesites" },
    },
    pickBox: "Elige tu caja",
    qty: "Cantidad",
    addExtras: "Sumar extras",
    pickCuts: "Toca los cortes que quieres",
    kg: "Kilos",
    thickness: "Grosor",
    grade: "Línea",
    grades: { seleccion: "Selección", reserva: "Reserva" },
    guests: "Invitados",
    occasion: "Ocasión",
    occasions: ["Cumpleaños", "Familiar", "Empresa", "Boda", "Otro"],
    suggested: "Sugerimos",
    perPerson: "≈ 400 g por persona",
    topic: "Tema",
    topics: ["Envíos", "Pagos", "Cortes", "Cocción", "Precios por mayor", "Otro"],
    message: "Tu mensaje",
    messagePh: "Escribe tu pregunta…",
    name: "Nombre",
    zone: "Barrio o zona",
    zonePh: "Ej. Equipetrol, 3er anillo",
    when: "¿Para cuándo?",
    fulfil: "Entrega",
    delivery: "Envío a domicilio",
    pickup: "Retiro en tienda",
    notes: "Algo más",
    notesPh: "Indicaciones, preferencias, alergias…",
    back: "Atrás",
    next: "Siguiente",
    send: "Enviar por WhatsApp",
    edit: "Cambiar",
    online: "en línea",
    typing: "escribiendo…",
    greet: "¡Hola! 👋 Soy Don Corte Fino. Cuéntanos qué necesitas y te respondemos al toque 🥩",
    inputPh: "Mensaje",
    sentNote: "Se abre WhatsApp con este mensaje listo. Solo tocas enviar.",
    approx: "aprox.",
    msg: {
      hi: "¡Hola Don Corte Fino!",
      bundle: "Quiero pedir una caja de parrilla",
      steak: "Quiero pedir estos cortes",
      event: "Estoy organizando un asado / evento",
      question: "Tengo una consulta",
      box: "Caja",
      extras: "Extras",
      guests: "Invitados",
      occasion: "Ocasión",
      suggestion: "Cantidad sugerida",
      topic: "Tema",
      name: "Nombre",
      zone: "Zona",
      date: "Fecha",
      fulfil: "Entrega",
      notes: "Notas",
      total: "Total estimado",
      bye: "¡Gracias!",
    },
  },
  en: {
    kicker: "Inquiries & orders",
    title: "Build your order. Watch it land in WhatsApp.",
    sub: "Pick what you're after, tune the details and send it with one tap. We reply within minutes.",
    steps: ["What you need", "Details", "Your details", "Send"],
    kinds: {
      bundle: { t: "A grill box", d: "Ready-made parrilladas with charcoal, llajua and chimichurri" },
      steak: { t: "Cuts & steaks", d: "Choose cuts, weight, thickness and grade" },
      event: { t: "An asado or event", d: "Birthday, company or family: we size it for you" },
      question: { t: "I have a question", d: "Delivery, payment, cooking or anything else" },
    },
    pickBox: "Choose your box",
    qty: "Quantity",
    addExtras: "Add extras",
    pickCuts: "Tap the cuts you want",
    kg: "Kilos",
    thickness: "Thickness",
    grade: "Grade",
    grades: { seleccion: "Selección", reserva: "Reserva" },
    guests: "Guests",
    occasion: "Occasion",
    occasions: ["Birthday", "Family", "Company", "Wedding", "Other"],
    suggested: "We suggest",
    perPerson: "≈ 400 g per person",
    topic: "Topic",
    topics: ["Delivery", "Payment", "Cuts", "Cooking", "Wholesale prices", "Other"],
    message: "Your message",
    messagePh: "Type your question…",
    name: "Name",
    zone: "Neighbourhood",
    zonePh: "e.g. Equipetrol, 3rd ring",
    when: "When for?",
    fulfil: "Fulfilment",
    delivery: "Home delivery",
    pickup: "Store pickup",
    notes: "Anything else",
    notesPh: "Directions, preferences, allergies…",
    back: "Back",
    next: "Next",
    send: "Send on WhatsApp",
    edit: "Change",
    online: "online",
    typing: "typing…",
    greet: "Hi! 👋 This is Don Corte Fino. Tell us what you need and we'll get right back to you 🥩",
    inputPh: "Message",
    sentNote: "WhatsApp opens with this message ready. You just tap send.",
    approx: "approx.",
    msg: {
      hi: "Hi Don Corte Fino!",
      bundle: "I'd like to order a grill box",
      steak: "I'd like to order these cuts",
      event: "I'm planning an asado / event",
      question: "I have a question",
      box: "Box",
      extras: "Extras",
      guests: "Guests",
      occasion: "Occasion",
      suggestion: "Suggested amount",
      topic: "Topic",
      name: "Name",
      zone: "Area",
      date: "Date",
      fulfil: "Fulfilment",
      notes: "Notes",
      total: "Estimated total",
      bye: "Thanks!",
    },
  },
};

const EXTRA_SLUGS = ["carbon", "llajua", "aji-locoto", "chimichurri", "sal-en-escamas", "kit-encendido"];
const KINDS: Kind[] = ["bundle", "steak", "event", "question"];

/** Renders WhatsApp's *bold* and _italic_ markers the way the app does. */
function WaText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i} className="block min-h-[1em]">
          {line.split(/(\*[^*]+\*|_[^_]+_)/g).map((part, j) =>
            part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
              <b key={j}>{part.slice(1, -1)}</b>
            ) : part.startsWith("_") && part.endsWith("_") && part.length > 2 ? (
              <i key={j}>{part.slice(1, -1)}</i>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}

function Stepper({ value, set, step, min, max, fmt }: { value: number; set: (v: number) => void; step: number; min: number; max: number; fmt?: (v: number) => string }) {
  return (
    <div className="inline-flex items-center border border-champagne/25">
      <button type="button" aria-label="−" onClick={() => set(Math.max(min, +(value - step).toFixed(2)))} className="h-9 w-9 text-lg text-champagne transition hover:bg-champagne/10">
        −
      </button>
      <span className="min-w-[4.5rem] text-center font-display tabular-nums text-bone">{fmt ? fmt(value) : value}</span>
      <button type="button" aria-label="+" onClick={() => set(Math.min(max, +(value + step).toFixed(2)))} className="h-9 w-9 text-lg text-champagne transition hover:bg-champagne/10">
        +
      </button>
    </div>
  );
}

const chip = (on: boolean) =>
  `border px-3 py-2 text-left text-sm transition ${on ? "border-champagne bg-champagne/10 text-bone" : "border-champagne/20 text-steel hover:border-champagne/50 hover:text-bone"}`;
const field = "w-full border border-champagne/20 bg-noir/60 px-4 py-3 text-bone placeholder:text-ash/60 outline-none transition focus:border-champagne";

export default function InquiryFunnel({ locale, whatsapp }: { locale: Locale; whatsapp: string }) {
  const t = COPY[locale];
  const { offers, cuts, getProduct } = useCatalog();
  const boxes = offers.filter((o) => o.type === "bundle");
  const extrasList = EXTRA_SLUGS.map((s) => getProduct(s)).filter((p): p is NonNullable<typeof p> => !!p);

  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<Kind | null>(null);
  const [box, setBox] = useState<string | null>(null);
  const [boxQty, setBoxQty] = useState(1);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [picks, setPicks] = useState<Record<string, CutPick>>({});
  const [guests, setGuests] = useState(12);
  const [occasion, setOccasion] = useState(0);
  const [topic, setTopic] = useState(0);
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");
  const [date, setDate] = useState("");
  const [fulfil, setFulfil] = useState<"delivery" | "pickup">("delivery");
  const [notes, setNotes] = useState("");
  const [typing, setTyping] = useState(false);
  const root = useRef<HTMLElement>(null);
  const chat = useRef<HTMLDivElement>(null);

  // A box card's "Build my own" lands here with that box chosen
  useEffect(() => {
    const on = (e: Event) => {
      const det = (e as CustomEvent<InquireDetail>).detail;
      setKind(det.kind);
      if (det.key) setBox(det.key);
      setStep(1);
    };
    window.addEventListener(INQUIRE_EVENT, on);
    return () => window.removeEventListener(INQUIRE_EVENT, on);
  }, []);

  const fmtKg = (v: number) => `${v.toString().replace(".", locale === "es" ? "," : ".")} kg`;
  const priceKg = (slug: string, grade: Grade) => {
    const p = getProduct(slug);
    return p?.grades?.find((g) => g.key === grade)?.price_per_kg ?? p?.price_per_kg ?? 0;
  };

  const { text, total } = useMemo(() => {
    const m = t.msg;
    const L: string[] = [`${m.hi} 👋`];
    let sum = 0;
    if (!kind) return { text: L.join("\n"), total: 0 };
    L.push(`*${m[kind]}*`, "");
    if (kind === "bundle") {
      const o = boxes.find((b) => b.key === box);
      if (o) {
        const price = o.active && o.launch_price ? o.launch_price : o.regular_value ?? 0;
        sum += price * boxQty;
        L.push(`📦 ${m.box}: *${o.name[locale]}*${boxQty > 1 ? ` ×${boxQty}` : ""} — ${bs(price * boxQty)}`);
      }
      const ex = Object.entries(extras).filter(([, q]) => q > 0);
      if (ex.length) {
        L.push(`➕ ${m.extras}:`);
        ex.forEach(([s, q]) => {
          const p = getProduct(s);
          if (!p) return;
          sum += (p.price ?? 0) * q;
          L.push(`   • ${p.name[locale]}${q > 1 ? ` ×${q}` : ""} — ${bs((p.price ?? 0) * q)}`);
        });
      }
    }
    if (kind === "steak") {
      Object.entries(picks).forEach(([s, pk]) => {
        const p = getProduct(s);
        if (!p) return;
        const pkg = priceKg(s, pk.grade);
        sum += pkg * pk.kg;
        const thick = p.sale_type === "portion" ? ` · ${pk.cm}` : "";
        L.push(`🥩 *${p.name[locale]}* — ${fmtKg(pk.kg)}${thick} · ${t.grades[pk.grade]} (${t.approx} ${bs(Math.round(pkg * pk.kg))})`);
      });
    }
    if (kind === "event") {
      L.push(`👥 ${m.guests}: *${guests}*`, `🎉 ${m.occasion}: ${t.occasions[occasion]}`, `⚖️ ${m.suggestion}: ~${fmtKg(Math.round(guests * 0.4 * 2) / 2)}`);
    }
    if (kind === "question") {
      L.push(`💬 ${m.topic}: *${t.topics[topic]}*`);
      if (question.trim()) L.push("", question.trim());
    }
    const who = [
      name.trim() && `👤 ${m.name}: ${name.trim()}`,
      kind !== "question" && `🚚 ${m.fulfil}: ${fulfil === "delivery" ? t.delivery : t.pickup}`,
      zone.trim() && fulfil === "delivery" && `📍 ${m.zone}: ${zone.trim()}`,
      date && `📅 ${m.date}: ${new Date(date + "T12:00").toLocaleDateString(locale === "es" ? "es-BO" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}`,
      notes.trim() && `📝 ${m.notes}: ${notes.trim()}`,
    ].filter(Boolean) as string[];
    if (who.length) L.push("", ...who);
    if (sum > 0) L.push("", `💰 *${m.total}: ${bs(Math.round(sum))}*`);
    L.push("", m.bye);
    return { text: L.join("\n"), total: sum };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, box, boxQty, extras, picks, guests, occasion, topic, question, name, zone, date, fulfil, notes, locale]);

  // "typing…" flickers in the header whenever the message changes, like the other side is watching
  useEffect(() => {
    setTyping(true);
    const id = window.setTimeout(() => setTyping(false), 650);
    chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: "smooth" });
    return () => window.clearTimeout(id);
  }, [text]);

  const canNext =
    step === 0 ? !!kind : step === 1 ? (kind === "bundle" ? !!box : kind === "steak" ? Object.keys(picks).length > 0 : kind === "question" ? question.trim().length > 2 : true) : step === 2 ? name.trim().length > 1 : true;
  const href = waLink(whatsapp, text);
  const go = (n: number) => {
    setStep(n);
    root.current?.querySelector("[data-funnel-top]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section ref={root} id="consulta" className="relative scroll-mt-20 overflow-hidden bg-noir px-4 py-28 md:px-10 md:py-40">
      <div className="pointer-events-none absolute -right-40 top-20 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(126,44,62,0.35),transparent_65%)]" />
      <div className="relative mx-auto max-w-[1500px]">
        <div className="mb-14 grid gap-6 md:mb-20 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="label mb-5">{t.kicker}</p>
            <h2 className="h-display text-4xl leading-[1.02] md:text-6xl">{t.title}</h2>
          </div>
          <p className="max-w-xl font-serif text-xl leading-relaxed text-steel md:text-2xl">{t.sub}</p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* ───── Funnel ───── */}
          <div data-funnel-top className="scroll-mt-28">
            <ol className="mb-8 grid grid-cols-4 gap-2">
              {t.steps.map((s, i) => (
                <li key={s}>
                  <button type="button" disabled={i > step} onClick={() => go(i)} className="group w-full text-left disabled:cursor-default">
                    <span className={`block h-[2px] transition-colors duration-500 ${i <= step ? "bg-champagne" : "bg-champagne/15"}`} />
                    <span className={`mt-2 block text-[0.62rem] uppercase tracking-[0.2em] ${i === step ? "text-bone" : i < step ? "text-champagne group-hover:text-bone" : "text-ash/60"}`}>
                      0{i + 1} · {s}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="min-h-[26rem]">
              <AnimatePresence mode="wait">
                <motion.div key={`${step}-${kind}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                  {step === 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {KINDS.map((k, i) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setKind(k);
                            setStep(1);
                          }}
                          className={`group relative overflow-hidden border p-6 text-left transition ${kind === k ? "border-champagne bg-champagne/10" : "border-champagne/15 hover:border-champagne/60"}`}
                        >
                          <span className="font-display text-sm text-wine">0{i + 1}</span>
                          <h3 className="h-display mt-3 text-xl md:text-2xl">{t.kinds[k].t}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-ash">{t.kinds[k].d}</p>
                          <span className="absolute bottom-5 right-5 translate-x-2 text-champagne opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">→</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 1 && kind === "bundle" && (
                    <div>
                      <p className="label mb-3">{t.pickBox}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {boxes.map((o) => {
                          const price = o.active && o.launch_price ? o.launch_price : o.regular_value ?? 0;
                          return (
                            <button key={o.key} type="button" onClick={() => setBox(o.key)} className={chip(box === o.key)}>
                              <span className="block font-display text-base text-bone">{o.name[locale]}</span>
                              <span className="mt-1 flex justify-between gap-2 text-xs text-ash">
                                <span>{o.serves?.[locale] ?? ""}</span>
                                <span className="text-champagne">{bs(price)}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-6 flex items-center gap-4">
                        <p className="label">{t.qty}</p>
                        <Stepper value={boxQty} set={setBoxQty} step={1} min={1} max={20} />
                      </div>
                      {extrasList.length > 0 && (
                        <>
                          <p className="label mb-3 mt-8">{t.addExtras}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {extrasList.map((p) => {
                              const q = extras[p.slug] ?? 0;
                              return (
                                <div key={p.slug} className={`flex items-center justify-between gap-3 border px-3 py-2 ${q ? "border-champagne/60" : "border-champagne/15"}`}>
                                  <span className="text-sm text-steel">
                                    {p.name[locale]} <span className="text-xs text-ash">· {bs(p.price ?? 0)}</span>
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <button type="button" aria-label="−" onClick={() => setExtras((e) => ({ ...e, [p.slug]: Math.max(0, q - 1) }))} className="h-7 w-7 border border-champagne/20 text-champagne">
                                      −
                                    </button>
                                    <span className="w-4 text-center font-display tabular-nums text-bone">{q}</span>
                                    <button type="button" aria-label="+" onClick={() => setExtras((e) => ({ ...e, [p.slug]: q + 1 }))} className="h-7 w-7 border border-champagne/20 text-champagne">
                                      +
                                    </button>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {step === 1 && kind === "steak" && (
                    <div>
                      <p className="label mb-3">{t.pickCuts}</p>
                      <div className="flex flex-wrap gap-2">
                        {cuts.map((p) => {
                          const on = !!picks[p.slug];
                          return (
                            <button
                              key={p.slug}
                              type="button"
                              aria-pressed={on}
                              onClick={() =>
                                setPicks((cur) => {
                                  const next = { ...cur };
                                  if (on) delete next[p.slug];
                                  else next[p.slug] = { kg: 1, cm: p.portions?.[1]?.label[locale] ?? p.portions?.[0]?.label[locale] ?? "", grade: "seleccion" };
                                  return next;
                                })
                              }
                              className={chip(on)}
                            >
                              {on && <span className="mr-1 text-champagne">✓</span>}
                              {p.name[locale].replace(/ Wangus.*$/, "")}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-6 space-y-3">
                        {Object.entries(picks).map(([slug, pk]) => {
                          const p = getProduct(slug);
                          if (!p) return null;
                          const set = (patch: Partial<CutPick>) => setPicks((c) => ({ ...c, [slug]: { ...c[slug], ...patch } }));
                          const sizes = (p.portions ?? []).map((x) => x.label[locale]);
                          return (
                            <div key={slug} className="border border-champagne/15 bg-charcoal/40 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="font-display text-lg text-bone">{p.name[locale]}</p>
                                <p className="text-xs text-champagne">
                                  {bs(priceKg(slug, pk.grade))}/kg
                                </p>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                                <Stepper value={pk.kg} set={(v) => set({ kg: v })} step={0.5} min={0.5} max={20} fmt={fmtKg} />
                                {p.sale_type === "portion" && sizes.length > 0 && (
                                  <div className="flex gap-1">
                                    {sizes.map((cm) => (
                                      <button key={cm} type="button" onClick={() => set({ cm })} className={`px-2.5 py-1.5 text-xs ${pk.cm === cm ? "bg-champagne text-noir" : "border border-champagne/20 text-steel"}`}>
                                        {cm}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-1">
                                  {(["seleccion", "reserva"] as Grade[]).map((g) => (
                                    <button key={g} type="button" onClick={() => set({ grade: g })} className={`px-2.5 py-1.5 text-xs ${pk.grade === g ? "bg-burgundy text-bone" : "border border-champagne/20 text-steel"}`}>
                                      {t.grades[g]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 1 && kind === "event" && (
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-baseline justify-between">
                          <p className="label">{t.guests}</p>
                          <p className="font-display text-4xl text-bone tabular-nums">{guests}</p>
                        </div>
                        <input type="range" min={4} max={120} value={guests} onChange={(e) => setGuests(+e.target.value)} className="mt-4 w-full accent-[#7E2C3E]" />
                        <p className="mt-3 text-sm text-steel">
                          {t.suggested} <span className="font-display text-xl text-champagne">{fmtKg(Math.round(guests * 0.4 * 2) / 2)}</span> <span className="text-ash">· {t.perPerson}</span>
                        </p>
                      </div>
                      <div>
                        <p className="label mb-3">{t.occasion}</p>
                        <div className="flex flex-wrap gap-2">
                          {t.occasions.map((o, i) => (
                            <button key={o} type="button" onClick={() => setOccasion(i)} className={chip(occasion === i)}>
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && kind === "question" && (
                    <div className="space-y-6">
                      <div>
                        <p className="label mb-3">{t.topic}</p>
                        <div className="flex flex-wrap gap-2">
                          {t.topics.map((o, i) => (
                            <button key={o} type="button" onClick={() => setTopic(i)} className={chip(topic === i)}>
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="block">
                        <span className="label mb-3 block">{t.message}</span>
                        <textarea rows={5} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t.messagePh} className={field} />
                      </label>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="label mb-2 block">{t.name}</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
                      </label>
                      <label className="block">
                        <span className="label mb-2 block">{t.when}</span>
                        <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={`${field} [color-scheme:dark]`} />
                      </label>
                      {kind !== "question" && (
                        <div className="sm:col-span-2">
                          <span className="label mb-2 block">{t.fulfil}</span>
                          <div className="grid grid-cols-2 gap-2">
                            {(["delivery", "pickup"] as const).map((f) => (
                              <button key={f} type="button" onClick={() => setFulfil(f)} className={chip(fulfil === f)}>
                                {f === "delivery" ? t.delivery : t.pickup}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {kind !== "question" && fulfil === "delivery" && (
                        <label className="block sm:col-span-2">
                          <span className="label mb-2 block">{t.zone}</span>
                          <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder={t.zonePh} className={field} />
                        </label>
                      )}
                      <label className="block sm:col-span-2">
                        <span className="label mb-2 block">{t.notes}</span>
                        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPh} className={field} />
                      </label>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="border border-champagne/15 bg-charcoal/40 p-6 md:p-8">
                      <p className="label mb-4">{t.steps[3]}</p>
                      <p className="font-serif text-xl leading-relaxed text-steel">{t.sentNote}</p>
                      {total > 0 && (
                        <p className="mt-6 text-sm text-ash">
                          {t.msg.total}: <span className="font-display text-3xl text-champagne">{bs(Math.round(total))}</span>
                        </p>
                      )}
                      <a href={href} target="_blank" rel="noopener" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-7 py-4 font-semibold text-[#06281a] shadow-[0_10px_30px_rgba(37,211,102,0.3)] transition hover:brightness-110">
                        <WaGlyph className="h-5 w-5" />
                        {t.send}
                      </a>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-champagne/10 pt-6">
              <button type="button" onClick={() => go(Math.max(0, step - 1))} className={`text-xs uppercase tracking-[0.25em] text-ash transition hover:text-bone ${step === 0 ? "invisible" : ""}`}>
                ← {t.back}
              </button>
              {step < 3 && (
                <button type="button" disabled={!canNext} onClick={() => go(step + 1)} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                  {t.next} →
                </button>
              )}
            </div>
          </div>

          {/* ───── WhatsApp simulator ───── */}
          <div className="lg:sticky lg:top-24">
            <div className="relative mx-auto w-full max-w-[380px] rounded-[3rem] border border-champagne/20 bg-[#0b0b0b] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.6),inset_0_0_0_2px_rgba(255,255,255,0.04)]">
              <div className="absolute left-1/2 top-5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
              <div className="flex h-[min(600px,72vh)] min-h-[480px] flex-col overflow-hidden rounded-[2.4rem] bg-[#0b141a]">
                {/* header */}
                <div className="flex items-center gap-3 bg-[#1f2c34] px-4 pb-3 pt-10">
                  <span className="text-xl text-[#aebac1]">‹</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-burgundy font-display text-xs text-bone">DCF</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-medium text-[#e9edef]">Don Corte Fino</p>
                    <p className="text-[0.7rem] text-[#8696a0]">{typing ? <span className="text-[#25D366]">{t.typing}</span> : t.online}</p>
                  </div>
                  <span className="text-[#aebac1]">⋮</span>
                </div>
                {/* chat */}
                <div
                  ref={chat}
                  className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-3 py-4 [background-image:radial-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:14px_14px]"
                >
                  <p className="mx-auto w-fit rounded-md bg-[#182229] px-3 py-1 text-[0.65rem] uppercase tracking-wider text-[#8696a0]">{locale === "es" ? "Hoy" : "Today"}</p>
                  <div className="max-w-[85%] rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2 text-[0.82rem] leading-snug text-[#e9edef] shadow">
                    {t.greet}
                    <span className="mt-1 block text-right text-[0.6rem] text-[#8696a0]">09:41</span>
                  </div>
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={kind ?? "none"}
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="ml-auto max-w-[88%] origin-bottom-right rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 text-[0.82rem] leading-snug text-[#e9edef] shadow"
                    >
                      <WaText text={text} />
                      <span className="mt-1 block text-right text-[0.6rem] text-[#9fd7c9]">
                        09:42 <span className={typing ? "text-[#9fd7c9]" : "text-[#53bdeb]"}>✓✓</span>
                      </span>
                    </motion.div>
                  </AnimatePresence>
                  {typing && (
                    <div className="flex w-fit gap-1 rounded-lg rounded-tl-none bg-[#202c33] px-3 py-3">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8696a0]" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
                {/* composer */}
                <div className="flex items-center gap-2 bg-[#0b141a] px-2 pb-5 pt-2">
                  <div className="flex-1 truncate rounded-full bg-[#2a3942] px-4 py-2.5 text-[0.8rem] text-[#8696a0]">{t.inputPh}</div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener"
                    aria-label={t.send}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-[#06281a] shadow-[0_0_0_0_rgba(37,211,102,0.6)] transition hover:scale-105 ${kind ? "animate-[wa-pulse_2s_ease-out_infinite]" : ""}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                      <path d="M3.4 20.4 21.9 12 3.4 3.6l-.01 6.53L16 12l-12.61 1.87z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-ash">{t.sentNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}
