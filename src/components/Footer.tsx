import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { displayPhone, waLink } from "@/lib/order";

type Socials = { instagram: string | null; facebook: string | null; tiktok: string | null };

const ICONS: Record<keyof Socials | "whatsapp", string> = {
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  facebook: "M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.6L14 1.6c-4 0-4.9 3-4.9 4.9v2H6.8v4h2.3V22H14v-9.5h3.3l.4-4H14z",
  tiktok:
    "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z",
  whatsapp:
    "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.2 1.5z",
};

export default function Footer({ locale, whatsapp, socials }: { locale: Locale; whatsapp: string; socials: Socials }) {
  const d = getDict(locale);
  const links = [
    { key: "instagram" as const, label: "Instagram", href: socials.instagram },
    { key: "facebook" as const, label: "Facebook", href: socials.facebook },
    { key: "tiktok" as const, label: "TikTok", href: socials.tiktok },
    { key: "whatsapp" as const, label: "WhatsApp", href: waLink(whatsapp) },
  ].filter((l): l is typeof l & { href: string } => !!l.href);
  return (
    <footer className="relative overflow-hidden border-t border-champagne/10 bg-noir pt-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Image src="/brand/logo-800.webp" alt="Don Corte Fino" width={160} height={160} className="-ml-4 h-40 w-40" />
          <p className="mt-2 max-w-sm font-serif text-lg italic text-ash">“{d.hero.title1} {d.hero.title2}”</p>
        </div>
        <div>
          <p className="label mb-5">{d.footer.hours}</p>
          <a href={waLink(whatsapp)} target="_blank" rel="noopener" className="font-display text-2xl text-bone hover:text-champagne">
            {displayPhone(whatsapp)}
          </a>
          <p className="mt-2 text-sm text-ash">Santa Cruz de la Sierra, Bolivia</p>
          <p className="label mb-4 mt-8">{d.footer.follow}</p>
          <ul className="flex gap-3">
            {links.map((l) => (
              <li key={l.key}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={l.label}
                  title={l.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-champagne/25 text-champagne transition duration-300 hover:-translate-y-0.5 hover:border-champagne hover:bg-champagne hover:text-noir"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
                    <path d={ICONS[l.key]} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label mb-5">Menu</p>
          <ul className="space-y-3 text-sm text-steel">
            <li><Link href={`/${locale}/cortes`} className="hover:text-bone">{d.nav.cuts}</Link></li>
            <li><Link href={`/${locale}/tienda`} className="hover:text-bone">{d.nav.shop}</Link></li>
            <li><Link href={`/${locale}#cajas`} className="hover:text-bone">{d.nav.boxes}</Link></li>
            <li><Link href={`/${locale}#entregas`} className="hover:text-bone">{d.nav.delivery}</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-16 flex max-w-7xl flex-col gap-2 px-4 pb-6 text-[0.7rem] text-ash/80 md:flex-row md:justify-between md:px-8">
        <span>© {new Date().getFullYear()} Don Corte Fino. {d.footer.rights}</span>
        <span>{d.footer.ref}</span>
      </div>
      <div className="pointer-events-none select-none overflow-hidden whitespace-nowrap">
        <div className="marquee inline-block font-display text-[18vw] leading-[0.85] tracking-[0.02em] text-champagne/[0.04]">
          DON CORTE FINO ✦ DON CORTE FINO ✦&nbsp;
        </div>
      </div>
    </footer>
  );
}
