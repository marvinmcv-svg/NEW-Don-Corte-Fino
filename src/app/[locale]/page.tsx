import Link from "next/link";
import BoxCard from "@/components/BoxCard";
import CowMap from "@/components/CowMap";
import ProductCard from "@/components/ProductCard";
import { FireSection, HeroSection, HorizontalCuts, InstaStrip, ManifestoSection, MarblingSection, ProcessSection } from "@/components/landing/Sections";
import Magnetic from "@/components/motion/Magnetic";
import { RevealImage, SplitHeading, Stagger } from "@/components/motion/primitives";
import { cutProductsOf, visibleProducts, type Locale } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-server";
import { getDict } from "@/lib/i18n";
import { productPhoto, SCENES } from "@/lib/media";
import { displayPhone, waLink } from "@/lib/order";

function Head({ kicker, title, className = "" }: { kicker: string; title: string; className?: string }) {
  return (
    <div className={`mb-14 md:mb-20 ${className}`}>
      <p className="label mb-5">{kicker}</p>
      <SplitHeading className="h-display text-4xl leading-[1.02] md:text-7xl">{title}</SplitHeading>
    </div>
  );
}

export const revalidate = 300;

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const catalog = await getCatalog();
  const { offers, settings } = catalog;
  const products = visibleProducts(catalog);
  const cutProducts = cutProductsOf(catalog);
  const signature = cutProducts.filter((p) => productPhoto(p) && ["ojo-de-bife", "tomahawk", "bife-angosto", "lomo", "picana", "entrana", "t-bone", "tira-de-asado"].includes(p.slug));
  const bestSellers = ["ojo-de-bife", "picana", "bife-ancho", "vacio"].map((s) => products.find((p) => p.slug === s)!).filter(Boolean);
  const boxes = offers.filter((o) => o.type === "bundle");
  const promo = offers.find((o) => o.active && o.type === "promo_code");

  return (
    <>
      {promo && (
        <div className="fixed inset-x-0 top-16 z-40 bg-burgundy py-2 text-center text-[0.7rem] uppercase tracking-[0.2em] md:top-20">
          {promo.name[locale]} · <b>{promo.code}</b> — {promo.pitch[locale]}
        </div>
      )}

      <HeroSection locale={locale} d={d} />
      <ManifestoSection text={d.manifesto} />
      <MarblingSection d={d} />

      {/* Cow map */}
      <section className="px-4 py-28 md:px-10 md:py-40">
        <div className="mx-auto max-w-[1500px]">
          <Head kicker={d.map.kicker} title={d.map.title} />
          <CowMap locale={locale} />
        </div>
      </section>

      <HorizontalCuts locale={locale} d={d} items={signature} />
      <ProcessSection d={d} />
      <FireSection d={d} />

      {/* Store preview */}
      <section className="px-4 py-28 md:px-10 md:py-40">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Head kicker={d.store.kicker} title={d.store.title} />
            <Magnetic>
              <Link href={`/${locale}/tienda`} className="btn-ghost mb-14 md:mb-20">
                {d.store.all}
              </Link>
            </Magnetic>
          </div>
          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.slug} p={p} locale={locale} />
            ))}
          </Stagger>
        </div>
      </section>

      {/* Boxes */}
      <section id="cajas" className="scroll-mt-20 bg-noir px-4 py-28 md:px-10 md:py-40">
        <div className="mx-auto max-w-[1500px]">
          <Head kicker={d.boxes.kicker} title={d.boxes.title} />
          <Stagger className="grid gap-6 lg:grid-cols-2">
            {boxes.map((o) => (
              <BoxCard key={o.key} o={o} locale={locale} />
            ))}
          </Stagger>
        </div>
      </section>

      <InstaStrip d={d} waHref={settings.instagram_url ?? waLink(settings.whatsapp)} />

      {/* Delivery */}
      <section id="entregas" className="relative scroll-mt-20 overflow-hidden px-4 py-28 md:px-10 md:py-40">
        <div className="mx-auto grid max-w-[1500px] items-center gap-14 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <Head kicker={d.delivery.kicker} title={d.delivery.title} />
            <p className="max-w-xl font-serif text-2xl leading-relaxed text-steel">{d.delivery.body}</p>
            <p className="mt-4 text-sm text-champagne">{d.delivery.example}</p>
            <div className="mt-12 border-t border-champagne/10 pt-10">
              <p className="label">{d.delivery.orders}</p>
              <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener" className="mt-3 block font-display text-5xl text-bone transition hover:text-champagne md:text-7xl">
                {displayPhone(settings.whatsapp)}
              </a>
              <Magnetic>
                <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener" className="btn-primary mt-8">
                  WhatsApp
                </a>
              </Magnetic>
            </div>
          </div>
          <RevealImage src={SCENES.tomahawkTall.src} alt="Tomahawk Wagyu" width={SCENES.tomahawkTall.w} height={SCENES.tomahawkTall.h} className="aspect-[3/4]" sizes="(min-width:1024px) 40vw, 100vw" />
        </div>
      </section>
    </>
  );
}
