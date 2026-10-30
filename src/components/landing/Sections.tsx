"use client";

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import HeroGL from "@/components/motion/HeroGL";
import Magnetic from "@/components/motion/Magnetic";
import { fromPrice, type Locale, type Product } from "@/lib/catalog";
import { gsap, LOADED_EVENT, prefersReducedMotion, ScrollTrigger, SplitText } from "@/lib/gsap";
import { bs, type Dict } from "@/lib/i18n";
import { IG_POSTS, productPhoto, SCENES } from "@/lib/media";

gsap.registerPlugin(useGSAP);

/* ───────────────────────────── Hero ───────────────────────────── */

export function HeroSection({ locale, d }: { locale: Locale; d: Dict }) {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!title.current) return;
      if (prefersReducedMotion()) return;
      const split = SplitText.create(title.current, { type: "lines,chars", mask: "lines" });
      const intro = gsap.timeline({ paused: true });
      intro
        .from(split.chars, { yPercent: 115, rotateX: -70, transformOrigin: "50% 100%", stagger: 0.028, duration: 1.5 })
        .from("[data-hero-fade]", { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.3 }, "-=1.1")
        .from("[data-hero-rule]", { scaleX: 0, transformOrigin: "left center", duration: 1.6, ease: "expo.inOut" }, "<");
      const play = () => intro.play();
      if ((window as unknown as { __dcfLoaded?: boolean }).__dcfLoaded) play();
      else window.addEventListener(LOADED_EVENT, play, { once: true });

      gsap.to("[data-hero-content]", {
        yPercent: -35,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom 20%", scrub: true },
      });
      return () => {
        window.removeEventListener(LOADED_EVENT, play);
        split.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-noir">
      <HeroGL src={SCENES.heroGL} fallback={SCENES.hero.src} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-noir/60" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-noir/80 to-transparent" />

      <div data-hero-content className="relative z-10 mx-auto flex h-full max-w-[1500px] flex-col justify-end px-4 pb-24 md:px-10 md:pb-16">
        <p data-hero-fade className="label mb-6">
          {d.hero.kicker}
        </p>
        <h1 ref={title} className="h-display max-w-6xl text-[13vw] leading-[0.92] md:text-[8.4vw] lg:text-[7.6vw]" style={{ perspective: 600 }}>
          {d.hero.title1} <span className="text-champagne">{d.hero.title2}</span>
        </h1>
        <div data-hero-rule className="gold-rule mt-10 max-w-6xl" />
        <div className="mt-8 flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p data-hero-fade className="max-w-md font-serif text-xl leading-relaxed text-steel md:text-2xl">
            {d.hero.sub}
          </p>
          <div data-hero-fade className="flex flex-wrap gap-4">
            <Magnetic>
              <Link href={`/${locale}/cortes`} className="btn-primary">
                {d.hero.ctaCuts}
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href={`/${locale}/tienda`} className="btn-ghost backdrop-blur-sm">
                {d.hero.ctaShop}
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>

      <div data-hero-fade className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-4 md:flex">
        <span className="relative h-10 w-[22px] rounded-full border border-champagne/40">
          <span className="absolute left-1/2 top-2 h-2 w-[2px] -translate-x-1/2 animate-bounce bg-champagne" />
        </span>
        <span className="label text-[0.58rem] text-steel">{d.scrollHint}</span>
      </div>
      <div data-hero-fade className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 rotate-90 text-[0.6rem] uppercase tracking-[0.5em] text-steel/60 lg:block">
        Santa Cruz · 17.78° S · 63.18° W
      </div>
    </section>
  );
}

/* ───────────────────────────── Manifesto ───────────────────────────── */

const PILLS = [SCENES.marbling, SCENES.seared, SCENES.aging];

export function ManifestoSection({ text }: { text: string }) {
  const root = useRef<HTMLElement>(null);
  const words = text.split(" ");
  const pillAt = new Map([
    [5, 0],
    [Math.floor(words.length / 2), 1],
    [words.length - 6, 2],
  ]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        "[data-w]",
        { opacity: 0.12 },
        { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
      );
      gsap.from("[data-pill]", {
        width: 0,
        ease: "expo.out",
        duration: 1.4,
        stagger: 0.2,
        scrollTrigger: { trigger: root.current, start: "top 60%" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative px-4 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 flex items-center gap-4">
          <span className="text-wine">✦</span>
          <span className="gold-rule flex-1" />
        </div>
        <p className="font-serif text-[2rem] leading-[1.25] text-bone md:text-[3.6rem] md:leading-[1.15]">
          {words.map((w, i) => (
            <span key={i}>
              {pillAt.has(i) && (
                <span data-pill className="relative mx-2 inline-block h-[0.82em] w-[2.2em] overflow-hidden rounded-full align-[-0.08em]">
                  <Image src={PILLS[pillAt.get(i)!].src} alt="" fill sizes="200px" className="object-cover" />
                </span>
              )}
              <span data-w>{w} </span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────────── Marbling zoom (pinned) ───────────────────────────── */

export function MarblingSection({ d }: { d: Dict }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=220%", scrub: 1, pin: true, anticipatePin: 1 },
        });
        const startClip = window.innerWidth < 768 ? "inset(28% 10% 28% 10% round 160px)" : "inset(24% 34% 24% 34% round 220px)";
        tl.fromTo("[data-frame]", { clipPath: startClip }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
          .fromTo("[data-frame] img", { scale: 1.5 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
          .fromTo("[data-big] span", { yPercent: 0, letterSpacing: "0em" }, { yPercent: -40, opacity: 0, stagger: 0.03, duration: 0.6 }, 0.1)
          .to("[data-shade]", { opacity: 0.78, duration: 0.5 }, 0.6)
          .from("[data-copy] > *", { y: 80, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, 0.75)
          .from("[data-bms]", { scaleY: 0, transformOrigin: "bottom", stagger: 0.03, duration: 0.4 }, 0.95);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[680px] overflow-hidden bg-noir">
      <div data-frame className="absolute inset-0 overflow-hidden">
        <Image src={SCENES.ribeyePlate.src} alt="" fill sizes="100vw" className="object-cover" />
        <div data-shade className="absolute inset-0 bg-noir opacity-0" />
      </div>
      <h2 data-big className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-center font-display text-[13vw] leading-none text-bone drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        {d.marbling.toUpperCase().split("").map((c, i) => (
          <span key={i} className="inline-block">
            {c}
          </span>
        ))}
      </h2>

      <div data-copy className="absolute inset-x-0 bottom-0 mx-auto grid max-w-[1500px] gap-10 px-4 pb-14 md:grid-cols-[1.2fr_1fr] md:px-10 md:pb-20">
        <div>
          <p className="label mb-5">{d.wagyu.kicker}</p>
          <h3 className="h-display text-4xl leading-[1.02] md:text-6xl">{d.wagyu.title}</h3>
          <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-steel md:text-2xl">{d.wagyu.body}</p>
        </div>
        <div className="self-end">
          <div className="border-l-2 border-wine pl-5">
            <p className="h-display text-lg text-champagne">{d.wagyu.cross}</p>
            <p className="mt-2 text-sm leading-relaxed text-steel">{d.wagyu.crossBody}</p>
          </div>
          <p className="label mt-8 mb-3">{d.wagyu.bms}</p>
          <div className="flex h-16 items-end gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const ours = i >= 3 && i <= 6;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div data-bms className={`w-full ${ours ? "bg-gradient-to-t from-burgundy to-wine" : "bg-steel/15"}`} style={{ height: `${10 + i * 4}px` }} />
                  <span className={`text-[0.6rem] ${ours ? "text-champagne" : "text-ash/50"}`}>{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Signature cuts: pinned horizontal scroll ───────────────────────────── */

export function HorizontalCuts({ locale, d, items }: { locale: Locale; d: Dict; items: Product[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const t = track.current!;
        const dist = () => t.scrollWidth - window.innerWidth;
        const tween = gsap.to(t, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
        });
        gsap.to("[data-progress]", { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, scrub: true } });
        gsap.utils.toArray<HTMLElement>("[data-hcard] img").forEach((img) => {
          gsap.fromTo(img, { xPercent: -12 }, { xPercent: 12, ease: "none", scrollTrigger: { trigger: img.closest("[data-hcard]"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-noir py-24 md:flex md:h-[100svh] md:items-center md:py-0">
      <div ref={track} className="no-scrollbar flex gap-6 overflow-x-auto px-4 md:gap-10 md:overflow-visible md:px-10">
        <div className="flex w-[80vw] shrink-0 flex-col justify-center md:w-[34vw]">
          <p className="label mb-6">{d.signature.kicker}</p>
          <h2 className="h-display text-5xl leading-[0.95] md:text-[6vw]">{d.signature.title}</h2>
          <Link href={`/${locale}/cortes`} className="btn-ghost mt-10 self-start">
            {d.signature.all}
          </Link>
          <div className="mt-12 hidden h-px w-48 bg-champagne/15 md:block">
            <div data-progress className="h-full origin-left scale-x-0 bg-champagne" />
          </div>
        </div>
        {items.map((p, i) => {
          const ph = productPhoto(p);
          const price = fromPrice(p);
          return (
            <Link
              key={p.slug}
              href={`/${locale}/cortes/${p.slug}`}
              data-hcard
              data-cursor={locale === "es" ? "Ver" : "View"}
              className="group relative block h-[62vh] w-[72vw] shrink-0 overflow-hidden md:h-[70vh] md:w-[38vw] lg:w-[30vw]"
            >
              {ph && (
                <Image src={ph.main.src} alt={p.name[locale]} fill sizes="(min-width:768px) 40vw, 80vw" className="scale-[1.3] object-cover transition-[filter] duration-700 group-hover:brightness-110" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/10 to-transparent" />
              <span className="absolute left-5 top-5 font-display text-sm text-champagne">{String(i + 1).padStart(2, "0")}</span>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="h-display text-2xl md:text-3xl">{p.name[locale]}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-steel">
                    {d.store.from} <span className="font-display text-lg text-champagne">{bs(price.amount)}</span>
                    {price.perKg && "/kg"}
                  </span>
                  <span className="translate-x-4 text-xs uppercase tracking-[0.25em] text-bone opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                    {d.store.view} →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
        <div className="w-4 shrink-0 md:w-[10vw]" />
      </div>
    </section>
  );
}

/* ───────────────────────────── Process: pinned image stack ───────────────────────────── */

const PROCESS_IMAGES = [SCENES.selection, SCENES.aging, SCENES.butcher, SCENES.hero, SCENES.seared];

export function ProcessSection({ d }: { d: Dict }) {
  const root = useRef<HTMLElement>(null);
  const steps = d.process.steps;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const imgs = gsap.utils.toArray<HTMLElement>("[data-pimg]");
        const items = gsap.utils.toArray<HTMLElement>("[data-pstep]");
        gsap.set(imgs.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
        gsap.set(items.slice(1), { opacity: 0.2 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: `+=${steps.length * 70}%`, scrub: 1, pin: true, anticipatePin: 1 },
        });
        imgs.slice(1).forEach((img, i) => {
          tl.to(img, { clipPath: "inset(0% 0% 0% 0%)", ease: "power3.inOut", duration: 1 }, i)
            .fromTo(img.querySelector("img"), { scale: 1.4 }, { scale: 1, ease: "power3.out", duration: 1 }, i)
            .to(items[i], { opacity: 0.2, duration: 0.4 }, i + 0.2)
            .to(items[i + 1], { opacity: 1, duration: 0.4 }, i + 0.3)
            .to("[data-pnum]", { yPercent: (-100 / imgs.length) * (i + 1), ease: "power3.inOut", duration: 0.8 }, i + 0.1);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative bg-charcoal px-4 py-24 md:px-10 lg:flex lg:h-[100svh] lg:items-center lg:pb-6 lg:pt-24">
      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="label mb-6">{d.process.kicker}</p>
          <h2 className="h-display text-4xl leading-[1] md:text-5xl">{d.process.title}</h2>
          <div className="mt-6 hidden h-[5rem] overflow-hidden lg:block">
            <div data-pnum className="font-display text-[5rem] leading-none text-wine/80">
              {steps.map((_, i) => (
                <div key={i} className="h-[5rem]">
                  0{i + 1}
                </div>
              ))}
            </div>
          </div>
          <ol className="mt-6 space-y-3">
            {steps.map((s, i) => (
              <li key={s.t} data-pstep className="grid grid-cols-[3rem_1fr] gap-4 border-t border-champagne/10 pt-3">
                <span className="font-display text-champagne">0{i + 1}</span>
                <div>
                  <h3 className="h-display text-xl">{s.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ash">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative hidden h-[76vh] w-full overflow-hidden lg:block">
          {PROCESS_IMAGES.map((img, i) => (
            <div key={i} data-pimg className="absolute inset-0 overflow-hidden">
              <Image src={img.src} alt={steps[i]?.t ?? ""} fill sizes="50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/50 to-transparent" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {PROCESS_IMAGES.slice(1, 5).map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden">
              <Image src={img.src} alt="" fill sizes="50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Fire: full-bleed parallax statement ───────────────────────────── */

export function FireSection({ d }: { d: Dict }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo("[data-fire-img]", { yPercent: -18, scale: 1.25 }, { yPercent: 18, scale: 1.05, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      const split = SplitText.create("[data-fire-title]", { type: "chars" });
      gsap.from(split.chars, {
        opacity: 0,
        scale: 2.4,
        filter: "blur(12px)",
        stagger: { each: 0.03, from: "center" },
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%", end: "center 55%", scrub: 1 },
      });
      return () => split.revert();
    },
    { scope: root },
  );
  return (
    <section ref={root} className="relative flex h-[120svh] items-center justify-center overflow-hidden">
      <div data-fire-img className="absolute inset-0">
        <Image src={SCENES.grill.src} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-noir/55 to-charcoal" />
      <div className="relative z-10 px-4 text-center">
        <h2 data-fire-title className="h-display text-[14vw] leading-[0.9] md:text-[10vw]">
          {d.fire.line1}
          <br />
          <span className="text-champagne">{d.fire.line2}</span>
        </h2>
        <p className="mx-auto mt-8 max-w-md font-serif text-xl italic text-steel md:text-2xl">{d.fire.sub}</p>
      </div>
    </section>
  );
}

/* ───────────────────────────── Instagram strip with scroll-velocity skew ───────────────────────────── */

export function InstaStrip({ d, waHref }: { d: Dict; waHref: string }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-row]");
      const loops = rows.map((row, i) =>
        gsap.fromTo(row, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 40, ease: "none", repeat: -1 }),
      );
      const skew = gsap.quickTo("[data-row]", "skewX", { duration: 0.5, ease: "power3" });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity();
          const boost = 1 + Math.min(4, Math.abs(v) / 400);
          loops.forEach((l) => gsap.to(l, { timeScale: boost * (v < 0 ? -1 : 1), duration: 0.3, overwrite: true }));
          skew(gsap.utils.clamp(-8, 8, v / -250));
        },
      });
    },
    { scope: root },
  );
  const row = [...IG_POSTS, ...IG_POSTS];
  return (
    <section ref={root} className="overflow-hidden bg-noir py-28 md:py-36">
      <div className="mx-auto mb-14 flex max-w-[1500px] flex-wrap items-end justify-between gap-6 px-4 md:px-10">
        <div>
          <p className="label mb-5">{d.ig.kicker}</p>
          <h2 className="h-display text-4xl md:text-6xl">{d.ig.title}</h2>
        </div>
        <a href={waHref} target="_blank" rel="noopener" className="btn-ghost">
          {d.ig.cta}
        </a>
      </div>
      {[0, 1].map((r) => (
        <div key={r} data-row className="mb-4 flex w-max gap-4">
          {(r ? [...row].reverse() : row).map((p, i) => (
            <div key={i} className="group relative h-[34vh] w-[27vh] shrink-0 overflow-hidden md:h-[42vh] md:w-[34vh]">
              <Image src={p.src} alt="" fill sizes="300px" className="object-cover transition duration-700 group-hover:scale-110" />
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
