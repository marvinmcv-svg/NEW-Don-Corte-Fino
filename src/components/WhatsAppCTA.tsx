"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { bs } from "@/lib/i18n";
import { waLink } from "@/lib/order";

type Need = "box" | "cuts" | "event" | "question";

const COPY = {
  es: {
    kicker: "Pedidos a medida",
    title: "Cuéntanos qué necesitas",
    sub: "Cuatro pasos y te escribimos el mensaje. Lo envías por WhatsApp y te respondemos en minutos.",
    steps: ["Qué necesitas", "Detalles", "Tus datos", "Enviar"],
    needs: {
      box: { t: "Una caja parrillera", d: "Parrilladas listas con carbón, llajua y chimichurri" },
      cuts: { t: "Cortes y bifes", d: "Elige cortes, peso, grosor y grado" },
      event: { t: "Un asado o evento", d: "Cumpleaños, empresa o familia: lo armamos a tu medida" },
      question: { t: "Tengo una pregunta", d: "Envío, pago, cocción o lo que sea" },
    } as Record<Need, { t: string; d: string }>,
    boxPick: "¿Qué caja?",
    boxQty: "¿Cuántas?",
    boxNone: "Que me recomienden",
    cutsPick: "¿Qué cortes? (elige los que quieras)",
    kg: "Peso aproximado en total",
    kgOpts: ["1 kg", "2 kg", "3 kg", "5 kg o más"],
    thick: "Grosor",
    thickOpts: ["2 cm", "3 cm", "4 cm", "Que me recomienden"],
    occasion: "Ocasión",
    occasions: ["Cumpleaños", "Empresa", "Familia", "Otro"],
    guests: "Invitados",
    date: "Fecha",
    topic: "Tema",
    topics: ["Envío", "Pago", "Cocción", "Otro"],
    extra: "¿Algo más? (opcional)",
    extraPh: "Escribe aquí lo que quieras contarnos…",
    questionPh: "Escribe tu pregunta…",
    name: "Tu nombre",
    namePh: "¿Cómo te llamas?",
    how: "Entrega",
    delivery: "Delivery",
    pickup: "Retiro en tienda",
    zone: "Barrio / zona",
    zonePh: "Ej.: Equipetrol, Urubó…",
    when: "¿Para cuándo? (opcional)",
    ready: "Tu mensaje está listo",
    readySub: "Revísalo en el teléfono y envíalo. Abriremos WhatsApp con todo escrito: solo presiona enviar.",
    send: "Enviar por WhatsApp",
    sent: "¡Listo! Te esperamos en WhatsApp.",
    restart: "Empezar de nuevo",
    back: "Atrás",
    next: "Siguiente",
    online: "en línea",
    today: "Hoy",
    hello: "¡Hola! 👋 Somos Don Corte Fino. Cuéntanos qué necesitas y te respondemos enseguida 🥩",
    hi: "¡Hola Don Corte Fino! 👋",
    msgPh: "Mensaje",
    m: {
      box: "Quiero una caja parrillera",
      cuts: "Quiero pedir cortes",
      event: "Estoy armando un asado / evento",
      question: "Tengo una pregunta",
      boxLine: (n: string, q: number) => `• Caja: ${n}${q > 1 ? ` ×${q}` : ""}`,
      cutsLine: (c: string) => `• Cortes: ${c}`,
      kgLine: (k: string) => `• Peso aprox.: ${k}`,
      thickLine: (t: string) => `• Grosor: ${t}`,
      occLine: (o: string) => `• Ocasión: ${o}`,
      guestsLine: (g: number) => `• Invitados: ${g}`,
      dateLine: (d: string) => `• Fecha: ${d}`,
      topicLine: (t: string) => `• Tema: ${t}`,
      name: (n: string) => `Soy ${n}.`,
      deliver: (z: string) => `🚚 Delivery${z ? ` a ${z}` : ""}`,
      pickup: "🏬 Retiro en tienda",
      when: (d: string) => `📅 Para el ${d}`,
    },
  },
  en: {
    kicker: "Made to order",
    title: "Tell us what you need",
    sub: "Four quick steps and we write the message for you. Send it on WhatsApp and we'll reply within minutes.",
    steps: ["What you need", "Details", "Your details", "Send"],
    needs: {
      box: { t: "A grill box", d: "Ready-made parrilladas with charcoal, llajua and chimichurri" },
      cuts: { t: "Cuts & steaks", d: "Choose cuts, weight, thickness and grade" },
      event: { t: "An asado or event", d: "Birthday, company or family: we size it for you" },
      question: { t: "I have a question", d: "Delivery, payment, cooking or anything else" },
    } as Record<Need, { t: string; d: string }>,
    boxPick: "Which box?",
    boxQty: "How many?",
    boxNone: "Recommend one for me",
    cutsPick: "Which cuts? (pick as many as you like)",
    kg: "Approximate total weight",
    kgOpts: ["1 kg", "2 kg", "3 kg", "5 kg or more"],
    thick: "Thickness",
    thickOpts: ["2 cm", "3 cm", "4 cm", "Your recommendation"],
    occasion: "Occasion",
    occasions: ["Birthday", "Company", "Family", "Other"],
    guests: "Guests",
    date: "Date",
    topic: "Topic",
    topics: ["Delivery", "Payment", "Cooking", "Other"],
    extra: "Anything else? (optional)",
    extraPh: "Tell us anything that helps…",
    questionPh: "Type your question…",
    name: "Your name",
    namePh: "What's your name?",
    how: "Fulfilment",
    delivery: "Delivery",
    pickup: "Store pickup",
    zone: "Neighbourhood",
    zonePh: "E.g. Equipetrol, Urubó…",
    when: "When for? (optional)",
    ready: "Your message is ready",
    readySub: "Check it on the phone and send it. We'll open WhatsApp with everything written out: just press send.",
    send: "Send on WhatsApp",
    sent: "Done! See you on WhatsApp.",
    restart: "Start over",
    back: "Back",
    next: "Next",
    online: "online",
    today: "Today",
    hello: "Hi! 👋 This is Don Corte Fino. Tell us what you need and we'll get right back to you 🥩",
    hi: "Hi Don Corte Fino! 👋",
    msgPh: "Message",
    m: {
      box: "I'd like a grill box",
      cuts: "I'd like to order some cuts",
      event: "I'm planning an asado / event",
      question: "I have a question",
      boxLine: (n: string, q: number) => `• Box: ${n}${q > 1 ? ` ×${q}` : ""}`,
      cutsLine: (c: string) => `• Cuts: ${c}`,
      kgLine: (k: string) => `• Approx. weight: ${k}`,
      thickLine: (t: string) => `• Thickness: ${t}`,
      occLine: (o: string) => `• Occasion: ${o}`,
      guestsLine: (g: number) => `• Guests: ${g}`,
      dateLine: (d: string) => `• Date: ${d}`,
      topicLine: (t: string) => `• Topic: ${t}`,
      name: (n: string) => `I'm ${n}.`,
      deliver: (z: string) => `🚚 Delivery${z ? ` to ${z}` : ""}`,
      pickup: "🏬 Store pickup",
      when: (d: string) => `📅 For ${d}`,
    },
  },
};

const NEEDS: Need[] = ["box", "cuts", "event", "question"];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`chip ${on ? "chip-on" : ""}`}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="label mb-3">{label}</legend>
      {children}
    </fieldset>
  );
}

const fmtDate = (iso: string, locale: Locale) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === "es" ? "es-BO" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
};

/** Guided WhatsApp enquiry: four steps on the left, a live WhatsApp preview on the right. Shown above the footer on every page. */
export default function WhatsAppCTA({ locale, phone }: { locale: Locale; phone: string }) {
  const c = COPY[locale];
  const pathname = usePathname();
  const { offers, cuts } = useCatalog();
  const boxes = offers.filter((o) => o.type === "bundle");

  const [step, setStep] = useState(0);
  const [need, setNeed] = useState<Need | null>(null);
  const [box, setBox] = useState<string>("");
  const [boxQty, setBoxQty] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [kg, setKg] = useState("");
  const [thick, setThick] = useState("");
  const [occasion, setOccasion] = useState("");
  const [guests, setGuests] = useState(10);
  const [date, setDate] = useState("");
  const [topic, setTopic] = useState("");
  const [extra, setExtra] = useState("");
  const [name, setName] = useState("");
  const [how, setHow] = useState<"delivery" | "pickup">("delivery");
  const [zone, setZone] = useState("");
  const [when, setWhen] = useState("");
  const [sent, setSent] = useState(false);
  const [clock, setClock] = useState<[string, string]>(["09:41", "09:42"]);
  const [minDate, setMinDate] = useState<string | undefined>();
  const chat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const hm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setClock([hm(new Date(now.getTime() - 60_000)), hm(now)]);
    const pad = (n: number) => String(n).padStart(2, "0");
    setMinDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  }, []);

  const boxName = (key: string) => (key === "none" ? c.boxNone : boxes.find((o) => o.key === key)?.name[locale] ?? "");
  const cutName = (slug: string) => cuts.find((p) => p.slug === slug)?.name[locale] ?? slug;

  const message = useMemo(() => {
    const lines: string[] = [c.hi];
    if (need) lines.push("", c.m[need]);
    if (need === "box" && box) lines.push(c.m.boxLine(boxName(box), box === "none" ? 1 : boxQty));
    if (need === "cuts") {
      if (picked.length) lines.push(c.m.cutsLine(picked.map(cutName).join(", ")));
      if (kg) lines.push(c.m.kgLine(kg));
      if (thick) lines.push(c.m.thickLine(thick));
    }
    if (need === "event") {
      if (occasion) lines.push(c.m.occLine(occasion));
      lines.push(c.m.guestsLine(guests));
      if (date) lines.push(c.m.dateLine(fmtDate(date, locale)));
    }
    if (need === "question" && topic) lines.push(c.m.topicLine(topic));
    if (extra.trim()) lines.push("", extra.trim());
    if (step >= 2 && name.trim()) {
      lines.push("", c.m.name(name.trim()));
      lines.push(how === "delivery" ? c.m.deliver(zone.trim()) : c.m.pickup);
      if (when && need !== "event") lines.push(c.m.when(fmtDate(when, locale)));
    }
    return lines.join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, need, box, boxQty, picked, kg, thick, occasion, guests, date, topic, extra, step, name, how, zone, when, locale]);

  useEffect(() => {
    chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: "smooth" });
  }, [message]);

  const valid = [
    !!need,
    need === "box" ? !!box : need === "cuts" ? picked.length > 0 : need === "event" ? guests > 0 : need === "question" ? !!topic || !!extra.trim() : false,
    name.trim().length > 1,
    true,
  ];
  const canSend = valid[0] && valid[1] && valid[2];

  const send = () => {
    if (!canSend) return;
    window.open(waLink(phone, message), "_blank", "noopener,noreferrer");
    setSent(true);
  };
  const reset = () => {
    setStep(0);
    setNeed(null);
    setBox("");
    setBoxQty(1);
    setPicked([]);
    setKg("");
    setThick("");
    setOccasion("");
    setGuests(10);
    setDate("");
    setTopic("");
    setExtra("");
    setSent(false);
  };

  // The checkout already ends in WhatsApp; a second form there would only distract.
  if (/\/checkout$/.test(pathname)) return null;

  const toggleCut = (slug: string) => setPicked((v) => (v.includes(slug) ? v.filter((x) => x !== slug) : [...v, slug]));

  return (
    <section id="pedido-whatsapp" aria-labelledby="wa-cta-title" className="relative scroll-mt-20 overflow-hidden border-t border-champagne/10 bg-charcoal px-4 py-24 md:px-10 md:py-32">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-burgundy/25 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1400px] items-start gap-14 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-24">
        <div className="min-w-0">
          <p className="label mb-5">{c.kicker}</p>
          <h2 id="wa-cta-title" className="h-display text-3xl leading-[1.05] md:text-5xl">
            {c.title}
          </h2>
          <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-steel">{c.sub}</p>

          {/* Stepper */}
          <ol className="mt-12 grid grid-cols-4 gap-2 md:gap-3">
            {c.steps.map((s, i) => {
              const reachable = i <= step || valid.slice(0, i).every(Boolean);
              return (
                <li key={s}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => setStep(i)}
                    aria-current={i === step ? "step" : undefined}
                    className="group block w-full text-left disabled:cursor-not-allowed"
                  >
                    <span className="block h-[3px] w-full overflow-hidden bg-champagne/10">
                      <span className={`block h-full origin-left bg-champagne transition-transform duration-500 ${i <= step ? "scale-x-100" : "scale-x-0"}`} />
                    </span>
                    <span className={`mt-3 block text-[0.6rem] font-semibold uppercase tracking-[0.25em] transition md:text-[0.68rem] ${i === step ? "text-bone" : "text-ash/70 group-enabled:group-hover:text-steel"}`}>
                      0{i + 1}
                      <span className="hidden sm:inline"> · {s}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative mt-10 min-h-[22rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                {step === 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {NEEDS.map((k, i) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={need === k}
                        onClick={() => {
                          setNeed(k);
                          setTimeout(() => setStep(1), 220);
                        }}
                        className={`group border p-6 text-left transition duration-300 md:p-7 ${need === k ? "border-wine bg-burgundy/30" : "border-champagne/15 hover:border-champagne/50 hover:bg-coal/60"}`}
                      >
                        <span className="font-serif text-sm text-wine">0{i + 1}</span>
                        <span className="h-display mt-4 block text-xl md:text-2xl">{c.needs[k].t}</span>
                        <span className="mt-3 block text-sm leading-relaxed text-ash group-hover:text-steel">{c.needs[k].d}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && need === "box" && (
                  <div className="space-y-8">
                    <Field label={c.boxPick}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {boxes.map((o) => {
                          const price = o.active && o.launch_price ? o.launch_price : o.regular_value;
                          return (
                            <button key={o.key} type="button" aria-pressed={box === o.key} onClick={() => setBox(o.key)} className={`chip text-left ${box === o.key ? "chip-on" : ""}`}>
                              <span className="block font-display text-sm tracking-wide text-bone">{o.name[locale]}</span>
                              {price ? <span className="mt-1 block text-[0.72rem] text-champagne">{bs(price)}</span> : null}
                            </button>
                          );
                        })}
                        <Chip on={box === "none"} onClick={() => setBox("none")}>
                          {c.boxNone}
                        </Chip>
                      </div>
                    </Field>
                    {box && box !== "none" && (
                      <Field label={c.boxQty}>
                        <Stepper value={boxQty} min={1} max={20} onChange={setBoxQty} />
                      </Field>
                    )}
                  </div>
                )}

                {step === 1 && need === "cuts" && (
                  <div className="space-y-8">
                    <Field label={c.cutsPick}>
                      <div className="flex flex-wrap gap-2">
                        {cuts.map((p) => (
                          <Chip key={p.slug} on={picked.includes(p.slug)} onClick={() => toggleCut(p.slug)}>
                            {picked.includes(p.slug) ? "✓ " : ""}
                            {p.name[locale]}
                          </Chip>
                        ))}
                      </div>
                    </Field>
                    <div className="grid gap-8 sm:grid-cols-2">
                      <Field label={c.kg}>
                        <div className="flex flex-wrap gap-2">
                          {c.kgOpts.map((x) => (
                            <Chip key={x} on={kg === x} onClick={() => setKg(kg === x ? "" : x)}>
                              {x}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                      <Field label={c.thick}>
                        <div className="flex flex-wrap gap-2">
                          {c.thickOpts.map((x) => (
                            <Chip key={x} on={thick === x} onClick={() => setThick(thick === x ? "" : x)}>
                              {x}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                    </div>
                  </div>
                )}

                {step === 1 && need === "event" && (
                  <div className="space-y-8">
                    <Field label={c.occasion}>
                      <div className="flex flex-wrap gap-2">
                        {c.occasions.map((x) => (
                          <Chip key={x} on={occasion === x} onClick={() => setOccasion(x)}>
                            {x}
                          </Chip>
                        ))}
                      </div>
                    </Field>
                    <div className="grid gap-8 sm:grid-cols-2">
                      <Field label={c.guests}>
                        <Stepper value={guests} min={2} max={500} step={guests >= 30 ? 5 : 1} onChange={setGuests} />
                      </Field>
                      <label className="block">
                        <span className="label mb-3 block">{c.date}</span>
                        <input type="date" className="input" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
                      </label>
                    </div>
                  </div>
                )}

                {step === 1 && need === "question" && (
                  <div className="space-y-8">
                    <Field label={c.topic}>
                      <div className="flex flex-wrap gap-2">
                        {c.topics.map((x) => (
                          <Chip key={x} on={topic === x} onClick={() => setTopic(x)}>
                            {x}
                          </Chip>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <label className="mt-8 block">
                    <span className="label mb-3 block">{need === "question" ? c.questionPh.replace("…", "") : c.extra}</span>
                    <textarea className="input min-h-24 resize-y" maxLength={400} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={need === "question" ? c.questionPh : c.extraPh} />
                  </label>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <label className="block max-w-md">
                      <span className="label mb-3 block">{c.name}</span>
                      <input className="input" autoComplete="given-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder={c.namePh} />
                    </label>
                    <Field label={c.how}>
                      <div className="flex flex-wrap gap-2">
                        <Chip on={how === "delivery"} onClick={() => setHow("delivery")}>
                          {c.delivery}
                        </Chip>
                        <Chip on={how === "pickup"} onClick={() => setHow("pickup")}>
                          {c.pickup}
                        </Chip>
                      </div>
                    </Field>
                    <div className="grid gap-8 sm:grid-cols-2">
                      {how === "delivery" && (
                        <label className="block">
                          <span className="label mb-3 block">{c.zone}</span>
                          <input className="input" maxLength={80} value={zone} onChange={(e) => setZone(e.target.value)} placeholder={c.zonePh} />
                        </label>
                      )}
                      {need !== "event" && (
                        <label className="block">
                          <span className="label mb-3 block">{c.when}</span>
                          <input type="date" className="input" min={minDate} value={when} onChange={(e) => setWhen(e.target.value)} />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="max-w-xl">
                    <p className="h-display text-2xl md:text-3xl">{sent ? c.sent : c.ready}</p>
                    <p className="mt-4 font-serif text-xl leading-relaxed text-steel">{c.readySub}</p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button type="button" onClick={send} disabled={!canSend} className="btn inline-flex bg-[#25D366] text-noir hover:bg-[#2ee370] disabled:opacity-40">
                        <WaIcon className="h-4 w-4" />
                        {c.send}
                      </button>
                      {sent && (
                        <button type="button" onClick={reset} className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-ash hover:text-bone">
                          {c.restart}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-champagne/10 pt-8">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ash transition hover:text-bone">
                ← {c.back}
              </button>
            ) : (
              <span />
            )}
            {step < 3 && (
              <button type="button" disabled={!valid[step]} onClick={() => setStep(step + 1)} className="btn-primary disabled:pointer-events-none disabled:opacity-40">
                {c.next} →
              </button>
            )}
          </div>
        </div>

        {/* Live WhatsApp preview */}
        {/* On phones the mockup only appears as the final preview, so the form stays short. */}
        <div className={`mx-auto w-full max-w-[400px] lg:sticky lg:top-28 lg:block ${step === 3 ? "block" : "hidden"}`}>
          <div className="rounded-[3rem] border border-white/10 bg-[#0b0b0b] p-3 shadow-[0_40px_120px_-30px_rgba(97,33,47,0.6)]">
            <div className="relative flex h-[620px] flex-col overflow-hidden rounded-[2.4rem] bg-[#0b141a] max-sm:h-[540px]">
              <div className="absolute left-1/2 top-2.5 z-10 h-7 w-28 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
              <header className="flex items-center gap-3 bg-[#1f2c34] px-4 pb-3 pt-12">
                <span className="text-lg leading-none text-[#aebac1]" aria-hidden="true">‹</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy font-display text-[0.7rem] text-bone">DCF</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] font-medium text-[#e9edef]">Don Corte Fino</span>
                  <span className="block text-[0.72rem] text-[#8696a0]">{c.online}</span>
                </span>
                <span className="text-[#aebac1]" aria-hidden="true">⋮</span>
              </header>
              <div
                ref={chat}
                data-lenis-prevent
                className="no-scrollbar flex-1 space-y-2 overflow-y-auto bg-[#0b141a] bg-[radial-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] px-3 py-4 [background-size:14px_14px]"
              >
                <p className="mx-auto w-fit rounded-md bg-[#182229] px-3 py-1 text-[0.68rem] uppercase tracking-wide text-[#8696a0]">{c.today}</p>
                <div className="max-w-[85%] rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2 text-[0.85rem] leading-snug text-[#e9edef] shadow">
                  {c.hello}
                  <span className="mt-1 block text-right text-[0.62rem] text-[#8696a0]">{clock[0]}</span>
                </div>
                <motion.div layout className="ml-auto max-w-[88%] whitespace-pre-line break-words rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 text-[0.85rem] leading-snug text-[#e9edef] shadow">
                  {message}
                  <span className="mt-1 block text-right text-[0.62rem] text-[#8fd3c6]">
                    {clock[1]} <span className={sent ? "text-[#53bdeb]" : ""}>✓✓</span>
                  </span>
                </motion.div>
              </div>
              <div className="flex items-center gap-2 bg-[#0b141a] px-3 pb-5 pt-2">
                <span className="flex-1 rounded-full bg-[#202c33] px-4 py-3 text-sm text-[#8696a0]">{c.msgPh}</span>
                <button
                  type="button"
                  onClick={canSend ? send : () => setStep(valid.findIndex((v) => !v))}
                  aria-label={c.send}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-noir transition ${canSend ? "bg-[#25D366] hover:scale-105" : "bg-[#25D366]/50"}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M2 21 23 12 2 3v7l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stepper({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <button type="button" className="chip px-4 text-lg" onClick={() => onChange(Math.max(min, value - step))} aria-label="−">
        −
      </button>
      <span className="min-w-12 text-center font-display text-2xl text-bone">{value}</span>
      <button type="button" className="chip px-4 text-lg" onClick={() => onChange(Math.min(max, value + step))} aria-label="+">
        +
      </button>
    </div>
  );
}

function WaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.04.7C5.78.7.69 5.79.69 12.05c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.34-5.09 11.35-11.35 0-3.03-1.18-5.88-3.33-8.02" />
    </svg>
  );
}
