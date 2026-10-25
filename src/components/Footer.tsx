import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { displayPhone, waLink } from "@/lib/order";

export default function Footer({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  return (
    <footer className="relative overflow-hidden border-t border-champagne/10 bg-noir pt-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Image src="/brand/logo-800.webp" alt="Don Corte Fino" width={160} height={160} className="-ml-4 h-40 w-40" />
          <p className="mt-2 max-w-sm font-serif text-lg italic text-ash">“{d.hero.title1} {d.hero.title2}”</p>
        </div>
        <div>
          <p className="label mb-5">{d.footer.hours}</p>
          <a href={waLink()} target="_blank" rel="noopener" className="font-display text-2xl text-bone hover:text-champagne">
            {displayPhone}
          </a>
          <p className="mt-2 text-sm text-ash">Santa Cruz de la Sierra, Bolivia</p>
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
