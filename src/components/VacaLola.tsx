"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/catalog";
import { waLink } from "@/lib/order";

type Msg = { role: "user" | "assistant"; content: string };

const COPY = {
  es: {
    open: "Habla con Vaca Lola",
    help: "¿Te ayudamos?",
    wa: "WhatsApp",
    waSub: "Habla con una persona",
    lolaSub: "Respuestas al instante",
    title: "Vaca Lola",
    sub: "Recepcionista virtual · responde al instante",
    hello: "¡Muuu-y buenas! Soy Lola, la recepcionista de Don Corte Fino. Pregúntame por cortes, precios, envíos o cómo pedir. 🐄",
    ph: "Escribe tu pregunta…",
    send: "Enviar",
    close: "Cerrar",
    error: "Uy, se me cruzó el cable. Intenta de nuevo o escríbenos por WhatsApp.",
    chips: ["¿Qué es Wangus?", "¿Cuánto cuesta el envío?", "¿Qué corte para la parrilla?", "¿Cómo pago?"],
    note: "Lola puede equivocarse. Los precios se confirman por WhatsApp.",
  },
  en: {
    open: "Chat with Vaca Lola",
    help: "Need a hand?",
    wa: "WhatsApp",
    waSub: "Talk to a person",
    lolaSub: "Instant answers",
    title: "Vaca Lola",
    sub: "Virtual receptionist · instant answers",
    hello: "Moo-rning! I'm Lola, Don Corte Fino's receptionist. Ask me about cuts, prices, delivery or how to order. 🐄",
    ph: "Type your question…",
    send: "Send",
    close: "Close",
    error: "Oops, I got my wires crossed. Try again or message us on WhatsApp.",
    chips: ["What is Wangus?", "How much is delivery?", "Best cut for the grill?", "How do I pay?"],
    note: "Lola can make mistakes. Prices are confirmed on WhatsApp.",
  },
};

/** Friendly cow face used for the launcher and Lola's avatar. */
function LolaFace({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M8 20c-6-2-8 4-4 7 3 2 7 2 10 0M56 20c6-2 8 4 4 7-3 2-7 2-10 0" fill="#1d1d1c" stroke="#D6C5A7" strokeWidth="1.5" />
      <path d="M20 12c-2-6 2-9 4-6M44 12c2-6-2-9-4-6" fill="none" stroke="#D6C5A7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 26c0-10 8-16 18-16s18 6 18 16v8c0 4-2 6-4 8H18c-2-2-4-4-4-8z" fill="#1d1d1c" stroke="#D6C5A7" strokeWidth="1.5" />
      <path d="M24 12c3 3 13 3 16 0" fill="none" stroke="#7E2C3E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="27" r="2.6" fill="#E8E2D6" />
      <circle cx="40" cy="27" r="2.6" fill="#E8E2D6" />
      <ellipse cx="32" cy="44" rx="15" ry="11" fill="#c98b93" stroke="#7E2C3E" strokeWidth="1.5" />
      <ellipse cx="26" cy="44" rx="2.4" ry="3.2" fill="#61212F" />
      <ellipse cx="38" cy="44" rx="2.4" ry="3.2" fill="#61212F" />
      <path d="M28 50c2 1.5 6 1.5 8 0" fill="none" stroke="#61212F" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Turns plain text into lines, with site paths (/es/cortes/…) and URLs as links. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/((?:https?:\/\/[^\s)]+)|(?:\/(?:es|en)\/[\w\-/]+))/g).map((part, j) =>
            /^https?:\/\//.test(part) ? (
              <a key={j} href={part} target="_blank" rel="noopener" className="underline decoration-champagne/50 underline-offset-2 hover:text-champagne">
                {part}
              </a>
            ) : /^\/(es|en)\//.test(part) ? (
              <Link key={j} href={part} className="underline decoration-champagne/50 underline-offset-2 hover:text-champagne">
                {part.replace(/^\/(es|en)\//, "")}
              </Link>
            ) : (
              part.replace(/\*\*/g, "")
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

const WA_PATH =
  "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.04.7C5.78.7.69 5.79.69 12.05c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.34-5.09 11.35-11.35 0-3.03-1.18-5.88-3.33-8.02";

/** One floating "help" button for the whole site: opens a small menu with WhatsApp (a person) or Vaca Lola (instant answers). */
export default function VacaLola({ locale, phone }: { locale: Locale; phone: string }) {
  const c = COPY[locale];
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);
  useEffect(() => {
    if (open) field.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setMenu(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/lola", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) setMsgs([...next, { role: "assistant", content: c.error }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: c.error }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {menu && !open && (
          <motion.div
            className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-3"
            initial="hide"
            animate="show"
            exit="hide"
            variants={{ show: { transition: { staggerChildren: 0.06 } }, hide: {} }}
          >
            <motion.a
              variants={{ hide: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              href={waLink(phone)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(false)}
              className="flex items-center gap-3 rounded-full border border-champagne/20 bg-noir/95 py-1.5 pl-5 pr-1.5 shadow-xl backdrop-blur transition hover:border-[#25D366]"
            >
              <span className="text-right">
                <span className="block font-display text-xs uppercase tracking-[0.2em] text-bone">{c.wa}</span>
                <span className="block text-[0.65rem] text-ash">{c.waSub}</span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={WA_PATH} />
                </svg>
              </span>
            </motion.a>
            <motion.button
              variants={{ hide: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              onClick={() => {
                setMenu(false);
                setOpen(true);
              }}
              className="flex items-center gap-3 rounded-full border border-champagne/20 bg-noir/95 py-1.5 pl-5 pr-1.5 shadow-xl backdrop-blur transition hover:border-champagne"
            >
              <span className="text-right">
                <span className="block font-display text-xs uppercase tracking-[0.2em] text-bone">Vaca Lola</span>
                <span className="block text-[0.65rem] text-ash">{c.lolaSub}</span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-coal">
                <LolaFace className="h-9 w-9" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => (open ? setOpen(false) : setMenu((v) => !v))}
        aria-label={open ? c.close : c.help}
        aria-expanded={open || menu}
        className="pulse-ring group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105"
      >
        {open || menu ? (
          <span className="text-2xl leading-none" aria-hidden="true">✕</span>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={WA_PATH} />
            </svg>
            <span className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-champagne/40 bg-noir">
              <LolaFace className="h-6 w-6" />
            </span>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={c.title}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-24 top-20 z-50 flex origin-bottom-right flex-col overflow-hidden border border-champagne/20 bg-noir/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:top-auto sm:h-[min(620px,calc(100svh-8rem))] sm:w-[380px]"
          >
            <header className="flex items-center gap-3 border-b border-champagne/10 bg-gradient-to-r from-burgundy/40 to-transparent px-4 py-3">
              <LolaFace className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-base tracking-[0.12em] text-bone">{c.title}</p>
                <p className="flex items-center gap-1.5 truncate text-[0.68rem] text-steel">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {c.sub}
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label={c.close} className="flex h-9 w-9 items-center justify-center text-ash hover:text-bone">
                ✕
              </button>
            </header>

            <div ref={list} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" data-lenis-prevent>
              <Bubble role="assistant" text={c.hello} />
              {msgs.map((m, i) => (
                <Bubble key={i} role={m.role} text={m.content} typing={busy && i === msgs.length - 1 && !m.content} />
              ))}
              {msgs.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {c.chips.map((q) => (
                    <button key={q} onClick={() => ask(q)} className="chip text-[0.72rem]">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="border-t border-champagne/10 p-3"
            >
              <div className="flex gap-2">
                <input
                  ref={field}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={c.ph}
                  maxLength={600}
                  className="min-w-0 flex-1 border border-champagne/20 bg-coal px-3 py-2.5 text-sm text-bone outline-none placeholder:text-ash focus:border-champagne/60"
                />
                <button disabled={busy || !input.trim()} className="btn-primary !px-4 !py-2 disabled:opacity-40" aria-label={c.send}>
                  ➤
                </button>
              </div>
              <p className="mt-2 text-center text-[0.6rem] text-ash/80">{c.note}</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, text, typing }: { role: Msg["role"]; text: string; typing?: boolean }) {
  const me = role === "user";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
          me ? "bg-burgundy text-bone" : "border border-champagne/10 bg-coal text-steel"
        }`}
      >
        {typing ? (
          <span className="flex gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-champagne" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        ) : (
          <Rich text={text} />
        )}
      </div>
    </div>
  );
}
