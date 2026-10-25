import Link from "next/link";
import BoxCard from "@/components/BoxCard";
import CowMap from "@/components/CowMap";
import CutArt from "@/components/CutArt";
import { Hero, Manifesto, Marquee } from "@/components/Landing";
import ProductCard from "@/components/ProductCard";
import { Counter, MaskText, Reveal } from "@/components/Reveal";
import { featuredProducts, offers, products, type Locale } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";
import { displayPhone, waLink } from "@/lib/order";

function SectionHead({ kicker, title, center = false }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={`mb-12 md:mb-16 ${center ? "text-center" : ""}`}>
      <Reveal>
        <p className="label mb-5">{kicker}</p>
      </Reveal>
      <h2 className="h-display text-4xl leading-[1.05] md:text-6xl">
        <MaskText text={title} />
      </h2>
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const bestSellers = [
    ...featuredProducts.slice(0, 2),
    ...products.filter((p) => ["picana", "hamburguesas-x4", "entrana", "chimichurri"].includes(p.slug)),
  ].filter((p, i, a) => a.findIndex((x) => x.slug === p.slug) === i).slice(0, 4);
  const boxes = offers.filter((o) => o.type === "bundle");
  const promo = offers.find((o) => o.active && o.type === "promo_code");

  return (
    <>
      {promo && (
        <div className="fixed inset-x-0 top-16 z-40 bg-burgundy py-2 text-center text-[0.7rem] uppercase tracking-[0.2em] md:top-20">
          {promo.name[locale]} · <b>{promo.code}</b> — {promo.pitch[locale]}
        </div>
      )}

      <Hero locale={locale} d={d.hero} />
      <Manifesto text={d.manifesto} />

      {/* What makes Wagyu different */}
      <section className="relative overflow-hidden bg-noir px-4 py-28 md:px-8 md:py-36">
        <div className="marbling absolute inset-0 opacity-[0.03]" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHead kicker={d.wagyu.kicker} title={d.wagyu.title} />
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <Reveal>
                <p className="font-serif text-2xl leading-relaxed text-steel">{d.wagyu.body}</p>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="mt-10 border-l-2 border-wine pl-6">
                  <p className="h-display text-xl text-champagne">{d.wagyu.cross}</p>
                  <p className="mt-3 leading-relaxed text-ash">{d.wagyu.crossBody}</p>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="label mt-12 mb-4">{d.wagyu.bms}</p>
                <div className="flex gap-1">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className={`h-12 ${i >= 3 && i <= 6 ? "bg-gradient-to-t from-burgundy to-wine" : "bg-coal"}`}
                        style={{ opacity: 0.35 + (i / 12) * 0.65 }}
                      />
                      <p className={`mt-2 text-center text-[0.65rem] ${i >= 3 && i <= 6 ? "text-champagne" : "text-ash/60"}`}>{i + 1}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: d.wagyu.common, dense: 0.15, seed: "common", hl: false },
                { label: d.wagyu.ours, dense: 1.6, seed: "ours", hl: true },
              ].map((c, i) => (
                <Reveal key={c.seed} delay={i * 0.15}>
                  <div className={`card p-4 ${c.hl ? "border-wine/60" : ""}`}>
                    <div className={c.hl ? "velvet" : "bg-coal"}>
                      <CutArt seed={c.seed} shape="steak" dense={c.dense} className={`w-full ${c.hl ? "" : "saturate-50"}`} />
                    </div>
                    <p className={`mt-4 text-center text-xs uppercase tracking-[0.25em] ${c.hl ? "text-champagne" : "text-ash"}`}>{c.label}</p>
                  </div>
                </Reveal>
              ))}
              <div className="col-span-2 mt-6 grid grid-cols-3 gap-4 border-t border-champagne/10 pt-8">
                {d.wagyu.stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-4xl text-bone md:text-5xl">
                      <Counter to={s.n} suffix={s.suffix} />
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ash">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cow map */}
      <section className="px-4 py-28 md:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <SectionHead kicker={d.map.kicker} title={d.map.title} />
          <Reveal>
            <CowMap locale={locale} />
          </Reveal>
        </div>
      </section>

      {/* Signature cuts */}
      <section className="overflow-hidden bg-noir py-28 md:py-36">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead kicker={d.signature.kicker} title={d.signature.title} />
            <Link href={`/${locale}/cortes`} className="btn-ghost mb-12 md:mb-16">
              {d.signature.all}
            </Link>
          </div>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 md:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {featuredProducts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06} className="w-[78vw] shrink-0 snap-start sm:w-[340px]">
              <ProductCard p={p} locale={locale} large />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="px-4 py-28 md:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <SectionHead kicker={d.process.kicker} title={d.process.title} />
          <ol className="grid gap-px bg-champagne/10 md:grid-cols-5">
            {d.process.steps.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.1} className="bg-charcoal">
                <li className="group h-full p-7 transition hover:bg-coal">
                  <span className="font-display text-5xl text-wine/70 transition group-hover:text-wine">0{i + 1}</span>
                  <h3 className="h-display mt-6 text-lg">{s.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ash">{s.d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <Marquee items={["No es solo carne… es Wagyu", "¿Comer o disfrutar?", "Solo con Wagyu", "Premium ✦ Quality"]} />

      {/* Store preview */}
      <section className="px-4 py-28 md:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead kicker={d.store.kicker} title={d.store.title} />
            <Link href={`/${locale}/tienda`} className="btn-ghost mb-12 md:mb-16">
              {d.store.all}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}>
                <ProductCard p={p} locale={locale} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Boxes */}
      <section id="cajas" className="scroll-mt-20 bg-noir px-4 py-28 md:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <SectionHead kicker={d.boxes.kicker} title={d.boxes.title} />
          <div className="grid gap-6 lg:grid-cols-2">
            {boxes.map((o, i) => (
              <Reveal key={o.key} delay={i * 0.1}>
                <BoxCard o={o} locale={locale} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section id="entregas" className="relative scroll-mt-20 overflow-hidden px-4 py-28 md:px-8 md:py-36">
        <div className="velvet absolute inset-0 opacity-60" />
        <div className="marbling absolute inset-0 opacity-[0.05]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHead kicker={d.delivery.kicker} title={d.delivery.title} />
            <Reveal>
              <p className="font-serif text-2xl leading-relaxed text-steel">{d.delivery.body}</p>
              <p className="mt-4 text-sm text-champagne">{d.delivery.example}</p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="card bg-noir/70 p-10 text-center backdrop-blur">
              <p className="label">{d.delivery.orders}</p>
              <a href={waLink()} target="_blank" rel="noopener" className="mt-4 block font-display text-5xl text-bone transition hover:text-champagne md:text-6xl">
                {displayPhone}
              </a>
              <div className="gold-rule my-8" />
              <a href={waLink()} target="_blank" rel="noopener" className="btn-primary">
                WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
