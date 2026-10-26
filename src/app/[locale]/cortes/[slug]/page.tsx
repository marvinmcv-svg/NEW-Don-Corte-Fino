import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BuyPanel from "@/components/BuyPanel";
import CowMap from "@/components/CowMap";
import CutArt from "@/components/CutArt";
import ProductCard from "@/components/ProductCard";
import { MaskText, Meter, Reveal } from "@/components/Reveal";
import { badgeFor, cutProducts, fromPrice, getProduct, products, type Locale } from "@/lib/catalog";
import { CUTS, METHODS, PRIMALS, shapeFor, type Method } from "@/lib/cuts";
import { bs, getDict, LOCALES } from "@/lib/i18n";
import { DISH_PHOTOS, productPhoto } from "@/lib/media";
import Image from "next/image";
import { RevealImage } from "@/components/motion/primitives";

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap((locale) => cutProducts.map((p) => ({ locale, slug: p.slug })));

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const info = p.cut ? CUTS[p.cut] : undefined;
  return {
    title: p.name[locale],
    description: info?.story[locale].slice(0, 155),
    alternates: { languages: { es: `/es/cortes/${slug}`, en: `/en/cortes/${slug}` } },
  };
}

const ALL_METHODS: Method[] = ["grill", "pan", "oven", "sousvide", "smoker"];

export default async function CutPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const p = getProduct(slug);
  if (!p || !p.cut) notFound();
  const info = CUTS[p.cut];
  if (!info) notFound();
  const d = getDict(locale).cut;
  const price = fromPrice(p);
  const badge = badgeFor(p.badge, locale);
  const photo = productPhoto(p.slug);
  const related = cutProducts.filter((x) => x.slug !== p.slug && x.cut && CUTS[x.cut]?.primal === info.primal).slice(0, 3);
  const extras = products.filter((x) => x.sale_type === "addon").slice(0, 4 - Math.min(related.length, 3));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name[locale],
    description: info.story[locale],
    brand: { "@type": "Brand", name: "Don Corte Fino" },
    offers: { "@type": "Offer", priceCurrency: "BOB", price: price.amount, availability: p.status === "sold_out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
  };

  return (
    <article className="pt-24 md:pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 md:px-8">
        <div className="velvet absolute inset-0 opacity-70" />
        <div className="marbling absolute inset-0 opacity-[0.05]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 py-10 lg:grid-cols-2">
          <div>
            <Link href={`/${locale}/cortes`} className="label text-ash hover:text-champagne">
              ← {d.back}
            </Link>
            <div className="mt-8 flex flex-wrap gap-2">
              {info.primal && <span className="border border-champagne/30 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-champagne">{PRIMALS[info.primal][locale]}</span>}
              <span className="border border-champagne/30 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-champagne">{d.breed}</span>
              {badge && <span className="bg-burgundy px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em]">{badge}</span>}
            </div>
            <h1 className="h-display mt-6 text-5xl leading-[1] md:text-7xl">
              <MaskText text={p.name[locale]} />
            </h1>
            <Reveal delay={0.3}>
              <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-steel md:text-2xl">{info.story[locale]}</p>
              <p className="mt-6 text-steel">
                <span className="font-display text-3xl text-champagne">{bs(price.amount)}</span>
                {price.perKg && <span className="text-ash"> /kg</span>}
              </p>
            </Reveal>
          </div>
          {photo ? (
            <div className="grid grid-cols-[1fr_0.45fr] gap-3">
              <RevealImage src={photo.main.src} alt={p.name[locale]} width={photo.main.w} height={photo.main.h} priority className="aspect-[4/5]" sizes="(min-width:1024px) 35vw, 70vw" />
              {photo.alt && (
                <RevealImage src={photo.alt.src} alt="" width={photo.alt.w} height={photo.alt.h} className="mt-24 aspect-[3/5]" sizes="20vw" from="right" />
              )}
            </div>
          ) : (
            <Reveal delay={0.2}>
              <CutArt seed={p.slug} shape={shapeFor(p)} dense={1.3} className="mx-auto w-full max-w-lg drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]" />
            </Reveal>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 md:px-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-20">
          {/* Where + profile */}
          <section className="grid gap-12 md:grid-cols-2">
            <Reveal>
              <h2 className="label mb-6">{d.where}</h2>
              <CowMap locale={locale} active={info.primal} />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="label mb-6">{d.profile}</h2>
              <div className="space-y-5">
                {info.meters.map((v, i) => (
                  <Meter key={i} label={d.meters[i]} value={v} />
                ))}
              </div>
            </Reveal>
          </section>

          {/* Traits */}
          <section>
            <h2 className="label mb-6">{d.traits}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {info.traits.map((t, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="card h-full p-6">
                    <span className="text-wine">✦</span>
                    <p className="h-display mt-4 text-base">{t[locale]}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Cooking */}
          <section>
            <h2 className="h-display mb-8 text-3xl">{d.cook}</h2>
            <div className="grid grid-cols-5 gap-2">
              {ALL_METHODS.map((m) => {
                const ok = info.methods.includes(m);
                return (
                  <div key={m} className={`border p-3 text-center ${ok ? "border-wine/60 bg-burgundy/20" : "border-champagne/10 opacity-40"}`}>
                    <p className={`text-lg ${ok ? "text-champagne" : "text-ash"}`}>{ok ? "✓" : "✗"}</p>
                    <p className="mt-1 text-[0.6rem] uppercase tracking-[0.15em] text-steel">{METHODS[m][locale]}</p>
                  </div>
                );
              })}
            </div>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="border-l-2 border-wine pl-5">
                <dt className="label">{d.thickness}</dt>
                <dd className="mt-2 font-serif text-xl">{info.thickness[locale]}</dd>
              </div>
              {info.rest > 0 && (
                <div className="border-l-2 border-wine pl-5">
                  <dt className="label">{d.rest}</dt>
                  <dd className="mt-2 font-serif text-xl">
                    {info.rest} {d.min}
                  </dd>
                </div>
              )}
            </dl>
            {p.sale_type === "portion" || ["picanha", "tri-tip", "skirt", "flank", "flat-iron"].includes(p.cut) ? (
              <div className="mt-10">
                <p className="label mb-4">{d.temps}</p>
                <div className="grid grid-cols-2 gap-px bg-champagne/10 sm:grid-cols-4">
                  {d.doneness.map((x, i) => (
                    <div key={x.k} className="bg-charcoal p-4">
                      <div className="mb-3 h-2" style={{ background: ["#b8303f", "#c4505a", "#b9706b", "#8f6a5d"][i] }} />
                      <p className="text-xs text-ash">{x.k}</p>
                      <p className="font-display text-xl text-bone">{x.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Dishes */}
          <section>
            <h2 className="h-display mb-8 text-3xl">{d.dishes}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {info.dishes.map((x, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="card group h-full overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image src={DISH_PHOTOS[i % DISH_PHOTOS.length].src} alt={x[locale]} fill sizes="(min-width:640px) 22vw, 100vw" className="object-cover transition duration-[1.2s] group-hover:scale-110" />
                    </div>
                    <p className="p-5 font-serif text-lg text-bone">{x[locale]}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Pairings */}
          <section>
            <h2 className="h-display mb-8 text-3xl">{d.pairing}</h2>
            <dl className="divide-y divide-champagne/10 border-y border-champagne/10">
              {[
                [d.wine, info.wine],
                [d.sides, info.sides[locale]],
                [d.sauces, info.sauces[locale]],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                  <dt className="label">{k}</dt>
                  <dd className="font-serif text-xl text-steel">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <BuyPanel p={p} locale={locale} />
        </aside>
      </div>

      <section className="bg-noir px-4 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="h-display mb-10 text-3xl">{d.related}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...related, ...extras].slice(0, 4).map((x) => (
              <ProductCard key={x.slug} p={x} locale={locale} />
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
