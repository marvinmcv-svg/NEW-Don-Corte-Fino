"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/catalog";

type Msg = { role: "user" | "assistant"; content: string };

const COPY = {
  es: {
    open: "Habla con Vaca Lola",
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

export default function VacaLola({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [open, setOpen] = useState(false);
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
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={c.open}
        aria-expanded={open}
        className="group fixed bottom-[5.5rem] right-5 z-40 flex h-14 items-center gap-2 rounded-full border border-champagne/40 bg-noir/90 pl-1 pr-1 shadow-xl backdrop-blur transition hover:border-champagne md:pr-4"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coal">
          <LolaFace className="h-10 w-10 transition group-hover:-rotate-6" />
        </span>
        <span className="hidden font-display text-xs uppercase tracking-[0.2em] text-bone md:inline">{open ? c.close : "Vaca Lola"}</span>
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
            className="fixed inset-x-3 bottom-[10rem] top-20 z-50 flex origin-bottom-right flex-col overflow-hidden border border-champagne/20 bg-noir/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:top-auto sm:h-[min(620px,calc(100svh-12rem))] sm:w-[380px]"
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
