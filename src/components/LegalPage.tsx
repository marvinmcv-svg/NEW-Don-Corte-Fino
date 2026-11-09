import Link from "next/link";
import type { Locale } from "@/lib/catalog";
import { LEGAL_UPDATED, type LegalDoc } from "@/lib/legal";

export default function LegalPage({ doc, locale }: { doc: LegalDoc; locale: Locale }) {
  const updated = new Date(`${LEGAL_UPDATED}T12:00:00`).toLocaleDateString(locale === "es" ? "es-BO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="px-4 pb-24 pt-32 md:px-8 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <Link href={`/${locale}`} className="label text-ash hover:text-champagne">
          ← Don Corte Fino
        </Link>
        <h1 className="h-display mt-8 text-4xl leading-[1.05] md:text-6xl">{doc.title}</h1>
        <p className="mt-4 text-sm text-ash">
          {locale === "es" ? "Última actualización" : "Last updated"}: {updated}
        </p>
        <div className="gold-rule my-10" />
        <p className="font-serif text-xl leading-relaxed text-steel md:text-2xl">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.h} className="mt-12">
            <h2 className="h-display text-xl md:text-2xl">{s.h}</h2>
            <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-steel">
              {s.p.map((x, i) => (
                <p key={i}>{x}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
