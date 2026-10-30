"use client";

import { createContext, useCallback, useContext, useState } from "react";

export const ORDER_STATUSES = ["nuevo", "confirmado", "preparando", "en_camino", "entregado", "cancelado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  preparando: "Preparando",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_TONE: Record<string, string> = {
  nuevo: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmado: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  preparando: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  en_camino: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  entregado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelado: "bg-red-500/15 text-red-300 border-red-500/30",
  pendiente: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  pagado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  sold_out: "bg-red-500/15 text-red-300 border-red-500/30",
  hidden: "bg-steel/10 text-ash border-steel/20",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold ${STATUS_TONE[value] ?? "border-champagne/20 text-steel"}`}>
      {label ?? STATUS_LABEL[value as OrderStatus] ?? value}
    </span>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-bone">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ash">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className = "", actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={`rounded-xl border border-champagne/10 bg-coal/70 p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone = "" }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-champagne/10 bg-coal/70 p-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ash">{label}</p>
      <p className={`mt-2 font-display text-3xl ${tone || "text-bone"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ash">{hint}</p>}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "subtle"; size?: "sm" | "md" };
export function Button({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  const v = {
    primary: "bg-burgundy text-bone hover:bg-wine",
    ghost: "border border-champagne/25 text-bone hover:border-champagne/60",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
    subtle: "bg-champagne/5 text-steel hover:bg-champagne/10",
  }[variant];
  const s = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:opacity-40 ${v} ${s} ${className}`} {...rest} />;
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-steel">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.7rem] text-ash">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-champagne/15 bg-noir/70 px-3 py-2 text-sm text-bone placeholder:text-ash/60 outline-none transition focus:border-champagne/60";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-20 ${props.className ?? ""}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm text-steel" aria-pressed={checked}>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-emerald-600" : "bg-steel/20"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-bone transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-champagne/15 p-8 text-center text-sm text-ash">{children}</p>;
}

export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-champagne/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-noir/60 text-[0.7rem] uppercase tracking-[0.14em] text-ash">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-champagne/5">{children}</tbody>
      </table>
    </div>
  );
}

/* ───── Toasts ───── */
type Toast = { id: number; text: string; tone: "ok" | "err" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "err") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, tone }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {list.map((t) => (
          <div key={t.id} className={`rounded-lg px-4 py-3 text-sm shadow-xl ${t.tone === "ok" ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const fmtBs = (n: number | string | null | undefined) =>
  n === null || n === undefined || n === "" ? "—" : `Bs ${Number(n).toLocaleString("es-BO", { maximumFractionDigits: 2 })}`;
export const fmtDate = (d: string) =>
  new Date(d).toLocaleString("es-BO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
export const fmtKg = (n: number | string | null | undefined) => (n === null || n === undefined ? "—" : `${Number(n).toLocaleString("es-BO", { maximumFractionDigits: 3 })} kg`);

/** Tell the public site to refresh its cached catalogue. */
export const refreshSite = () => fetch("/api/revalidate", { method: "POST" }).catch(() => {});
