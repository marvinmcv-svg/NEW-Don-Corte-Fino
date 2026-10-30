"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ROLE_LABEL = { owner: "Dueño", staff: "Personal", editor: "Editor" } as const;

export default function Sidebar({ nav, email, role }: { nav: { href: string; label: string; icon: string }[]; email: string; role: keyof typeof ROLE_LABEL }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-champagne/10 bg-noir/95 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/brand/mark.webp" alt="" width={30} height={30} />
          <span className="font-display text-sm tracking-[0.15em] text-bone">ADMIN</span>
        </Link>
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg border border-champagne/20 px-3 py-1.5 text-sm text-bone" aria-expanded={open}>
          Menú
        </button>
      </div>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-champagne/10 bg-charcoal transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Link href="/admin" className="flex items-center gap-3 px-5 py-6">
          <Image src="/brand/mark.webp" alt="" width={40} height={40} />
          <span className="leading-tight">
            <span className="block font-display text-sm tracking-[0.12em] text-bone">CORTE FINO</span>
            <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-champagne">Admin</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active(n.href) ? "bg-burgundy text-bone" : "text-steel hover:bg-champagne/5 hover:text-bone"}`}
            >
              <span className="w-4 text-center text-champagne/80">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-champagne/10 p-4 text-xs">
          <p className="truncate text-steel">{email}</p>
          <p className="mt-0.5 text-champagne">{ROLE_LABEL[role]}</p>
          <div className="mt-3 flex items-center justify-between">
            <Link href="/es" target="_blank" className="text-ash hover:text-bone">Ver sitio ↗</Link>
            <form action="/admin/salir" method="post">
              <button className="text-ash hover:text-bone">Salir</button>
            </form>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
