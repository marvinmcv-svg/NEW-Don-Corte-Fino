"use client";

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import HeroGL from "@/components/motion/HeroGL";
import Magnetic from "@/components/motion/Magnetic";
import { SplitHeading } from "@/components/motion/primitives";
import { BOLIVIA, NEIGHBOURS, PLACES } from "./boliviaMap";
import { DeliveryVisual, VacuumVisual } from "./ProcessVisuals";
import { fromPrice, type Locale, type Product } from "@/lib/catalog";
import { gsap, LOADED_EVENT, prefersReducedMotion, ScrollTrigger, SplitText } from "@/lib/gsap";
import { bs, type Dict } from "@/lib/i18n";
import { HERO_SLIDES, IG_POSTS, ORIGIN_PHOTOS, productPhoto, SCENES } from "@/lib/media";

gsap.registerPlugin(useGSAP);

/* ───────────────────────────── Hero ───────────────────────────── */

const SLIDE_MS = 6500;

export function HeroSection({ locale, d }: { locale: Locale; d: Dict }) {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const n = HERO_SLIDES.length;
  const go = (i: number) => setIdx(((i % n) + n) % n);

  // Autoplay once the intro has played; pause while hovering the controls or off-screen.
  useEffect(() => {
    if (!started || paused) return;
    const t = window.setTimeout(() => go(idx + 1), SLIDE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, started]);

  // Swipe on touch screens
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let x0: number | null = null;
    const down = (e: PointerEvent) => void (e.pointerType === "touch" && (x0 = e.clientX));
    const up = (e: PointerEvent) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) setIdx((i) => (((i + (dx < 0 ? 1 : -1)) % n) + n) % n);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [n]);

  useGSAP(
    () => {
      const begin = () => setStarted(true);
      if (!title.current) return;
      if (prefersReducedMotion()) {
        begin();
        return;
      }
      const split = SplitText.create(title.current, { type: "lines,chars", mask: "lines" });
      const intro = gsap.timeline({ paused: true, onStart: begin });
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

  const slide = HERO_SLIDES[idx];
  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-noir" aria-roledescription="carousel">
      <HeroGL slides={HERO_SLIDES.map((s) => s.src)} index={idx} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-noir/60" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-noir/80 to-transparent" />

      <div data-hero-content className="relative z-10 mx-auto flex h-full max-w-[1500px] flex-col justify-end px-4 pb-28 md:px-10 md:pb-24">
        <p data-hero-fade className="label mb-6">
          {d.hero.kicker}
        </p>
        <h1 ref={title} className="h-display max-w-6xl text-[13vw] leading-[0.92] md:text-[8.4vw] lg:text-[7.6vw]" style={{ perspective: 600 }}>
          {d.hero.title1} <span className="text-champagne">{d.hero.title2}</span>
        </h1>
        <div data-hero-rule className="gold-rule mt-10 max-w-6xl" />
        <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6 md:pr-44">
          <Magnetic>
            <Link href={`/${locale}/cortes`} className="btn-primary">
              {d.hero.ctaCuts}
            </Link>
          </Magnetic>
          {/* Which breed is on screen */}
          <div className="min-w-0" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={idx} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.45 }}>
                <p className="font-display text-2xl uppercase tracking-[0.12em] text-bone md:text-3xl">{slide.breed}</p>
                <p className="mt-1 text-xs text-steel/80 md:text-sm">{slide.caption[locale]}</p>
                {slide.credit && <p className="mt-1 text-[0.6rem] text-ash/60">{locale === "es" ? "Foto" : "Photo"}: {slide.credit} · Wikimedia Commons</p>}
              </motion.div>
            </AnimatePresence>
          </div>
      {/* Carousel controls */}
          <div
            className="flex items-center gap-4 sm:ml-auto"
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
          >
            <span className="font-display text-sm tabular-nums text-champagne">
              {String(idx + 1).padStart(2, "0")} <span className="text-ash">/ {String(n).padStart(2, "0")}</span>
            </span>
            <div className="flex gap-1.5">
              {HERO_SLIDES.map((s, i) => (
                <button key={s.src} onClick={() => go(i)} aria-label={`${s.breed} ${i + 1}`} className="group relative h-6 w-8 md:w-12">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-bone/25" />
                  <span
                    key={i === idx ? `on-${idx}` : "off"}
                    className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-champagne"
                    style={
                      i === idx
                        ? { width: "100%", transformOrigin: "left", animation: started && !paused ? `dcf-slide ${SLIDE_MS}ms linear both` : undefined, transform: started && !paused ? undefined : "scaleX(1)" }
                        : { width: "100%", transform: "scaleX(0)" }
                    }
                  />
                </button>
              ))}
            </div>
            <div className="hidden gap-2 sm:flex">
              {[-1, 1].map((dir) => (
                <button
                  key={dir}
                  onClick={() => go(idx + dir)}
                  aria-label={dir < 0 ? (locale === "es" ? "Anterior" : "Previous") : locale === "es" ? "Siguiente" : "Next"}
                  className="grid h-10 w-10 place-items-center rounded-full border border-champagne/30 text-bone transition hover:border-champagne hover:bg-champagne/10"
                >
                  {dir < 0 ? "←" : "→"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div data-hero-fade className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 lg:flex">
        <span className="relative h-10 w-[22px] rounded-full border border-champagne/40" aria-label={d.scrollHint}>
          <span className="absolute left-1/2 top-2 h-2 w-[2px] -translate-x-1/2 animate-bounce bg-champagne" />
        </span>
      </div>
    </section>
  );
}

/* ───────────────────────────── Manifesto ───────────────────────────── */

/** Key words light up as the paragraph fills; on desktop each one reveals a photo that trails the cursor. */
const KEY_PHOTOS = [SCENES.marbling, SCENES.seared, SCENES.grill, SCENES.grill, SCENES.grill, SCENES.tomahawkTall];

export function ManifestoSection({ text, keys }: { text: string; keys: string[] }) {
  const root = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<number | null>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        "[data-w]",
        { opacity: 0.12 },
        { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
      );
      gsap.utils.toArray<HTMLElement>("[data-key-line]").forEach((line) => {
        gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: line, start: "top 75%", end: "top 55%", scrub: 0.6 } });
      });
      const el = preview.current!;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      const rTo = gsap.quickTo(el, "rotate", { duration: 0.8, ease: "power3" });
      let lastX = 0;
      const move = (e: PointerEvent) => {
        const r = root.current!.getBoundingClientRect();
        xTo(e.clientX - r.left);
        yTo(e.clientY - r.top);
        rTo(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
      };
      root.current!.addEventListener("pointermove", move);
      return () => root.current?.removeEventListener("pointermove", move);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative px-4 py-32 md:px-10 md:py-48">
      <div
        ref={preview}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 z-20 hidden h-56 w-44 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[999px] transition-[opacity,scale] duration-500 md:block ${shown === null ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
      >
        {KEY_PHOTOS.map((ph, i) => (
          <Image key={i} src={ph.src} alt="" fill sizes="180px" className={`object-cover transition-opacity duration-500 ${shown === i ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 flex items-center gap-4">
          <span className="text-wine">✦</span>
          <span className="gold-rule flex-1" />
        </div>
        <p className="font-serif text-[2rem] leading-[1.25] text-bone md:text-[3.6rem] md:leading-[1.15]">
          {words.map((w, i) => {
            const k = keys.indexOf(w);
            if (k < 0)
              return (
                <span key={i} data-w>
                  {w}{" "}
                </span>
              );
            return (
              <span key={i}>
                <span data-w className="relative inline-block cursor-default italic text-champagne" onPointerEnter={() => setShown(k)} onPointerLeave={() => setShown(null)}>
                  {w}
                  <span data-key-line className="absolute inset-x-0 -bottom-1 h-px origin-left bg-champagne/70" />
                </span>{" "}
              </span>
            );
          })}
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

      <div data-copy className="absolute inset-x-0 bottom-0 mx-auto grid max-w-[1500px] items-end gap-8 px-4 pb-12 md:grid-cols-[1.1fr_1fr] md:gap-14 md:px-10 md:pb-20">
        <div>
          <p className="label mb-5">{d.wagyu.kicker}</p>
          <h3 className="h-display text-4xl leading-[1.02] md:text-6xl">{d.wagyu.title}</h3>
          <p className="mt-6 hidden max-w-xl font-serif text-xl leading-relaxed text-steel sm:block md:text-2xl">{d.wagyu.body}</p>
        </div>
        <div className="border border-champagne/15 bg-noir/50 p-5 backdrop-blur-md md:p-7">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 md:gap-5">
            {[
              { name: "Wagyu", gives: d.wagyu.wagyuGives },
              null,
              { name: "Angus", gives: d.wagyu.angusGives },
            ].map((b, i) =>
              b ? (
                <div key={i}>
                  <p className="h-display text-xl text-bone md:text-2xl">{b.name}</p>
                  <ul className="mt-3 space-y-1.5 text-[0.8rem] leading-snug text-steel md:text-sm">
                    {b.gives.map((g) => (
                      <li key={g} className="flex gap-2">
                        <span className="text-wine">✦</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <span key={i} className="font-display text-3xl leading-none text-champagne md:text-4xl">
                  ×
                </span>
              ),
            )}
          </div>
          <div className="mt-5 flex items-baseline gap-4 border-t border-champagne/15 pt-5">
            <span className="h-display shrink-0 whitespace-nowrap text-3xl text-champagne md:text-4xl">= Wangus</span>
            <p className="text-[0.8rem] leading-snug text-steel md:text-sm">
              <span className="text-bone">{d.wagyu.cross}:</span> {d.wagyu.crossBody}
            </p>
          </div>
          <p className="label mt-6 mb-3">{d.wagyu.bms}</p>
          <div className="flex h-14 items-end gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const ours = i >= 3 && i <= 6;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div data-bms className={`w-full ${ours ? "bg-gradient-to-t from-burgundy to-wine" : "bg-steel/15"}`} style={{ height: `${8 + i * 3.4}px` }} />
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

/* ───────────────────────────── Origin: Santa Cruz → feedlot → Brazil ───────────────────────────── */

export function OriginSection({ d }: { d: Dict }) {
  const root = useRef<HTMLElement>(null);
  const o = d.origin;
  const P = PLACES;
  // Ruta 4: Santa Cruz → San José de Chiquitos → Roboré → Puerto Quijarro, gently curved between towns
  const route = `M${P.santaCruz[0]} ${P.santaCruz[1]} C ${P.santaCruz[0] + 60} ${P.santaCruz[1] - 30}, ${P.sanJose[0] - 70} ${P.sanJose[1] - 20}, ${P.sanJose[0]} ${P.sanJose[1]} S ${P.robore[0] - 30} ${P.robore[1] + 10}, ${P.robore[0]} ${P.robore[1]} S ${P.quijarro[0] - 50} ${P.quijarro[1] + 10}, ${P.quijarro[0]} ${P.quijarro[1]}`;
  const farm = [(P.santaCruz[0] + P.sanJose[0]) / 2 - 10, (P.santaCruz[1] + P.sanJose[1]) / 2 - 18];
  const chapters = [ORIGIN_PHOTOS.genetics, ORIGIN_PHOTOS.feedlot, ORIGIN_PHOTOS.land];

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-stat]").forEach((el) => {
        const n = Number(el.dataset.stat);
        const c = { v: 0 };
        gsap.to(c, {
          v: n,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => void (el.textContent = String(Math.round(c.v))),
        });
      });
      if (prefersReducedMotion()) return;
      // Country outline draws itself, then the route runs east as you read the chapters
      gsap.fromTo("[data-bo-outline]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut", scrollTrigger: { trigger: "[data-map]", start: "top 75%" } });
      gsap.from("[data-bo-fill]", { opacity: 0, duration: 2, delay: 0.8, scrollTrigger: { trigger: "[data-map]", start: "top 75%" } });
      const tl = gsap.timeline({ scrollTrigger: { trigger: "[data-chapters]", start: "top 60%", end: "bottom 70%", scrub: 0.8 } });
      tl.fromTo("[data-route-path]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", duration: 1 })
        .from("[data-route-stop]", { scale: 0, transformOrigin: "center", stagger: 0.3, duration: 0.15, ease: "back.out(3)" }, 0)
        .from("[data-route-label]", { autoAlpha: 0, y: 12, stagger: 0.3, duration: 0.2 }, 0.03);
      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((ch) => {
        const img = ch.querySelector("[data-ch-img]");
        gsap.fromTo(img, { clipPath: "inset(18% 12% 18% 12%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out", scrollTrigger: { trigger: ch, start: "top 85%", end: "top 35%", scrub: 0.6 } });
        gsap.fromTo(ch.querySelector("[data-ch-img] img"), { scale: 1.35 }, { scale: 1.05, ease: "none", scrollTrigger: { trigger: ch, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(ch.querySelectorAll("[data-ch-text] > *"), { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1, scrollTrigger: { trigger: ch, start: "top 70%" } });
      });
      gsap.to("[data-topo]", { yPercent: -12, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="origen" className="relative scroll-mt-20 overflow-x-clip bg-noir px-4 py-28 md:px-10 md:py-40">
      {/* contour lines, like a survey map of the plains */}
      <svg data-topo aria-hidden="true" className="pointer-events-none absolute inset-0 h-[120%] w-full opacity-[0.06]" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M-20 ${60 + i * 38} C 160 ${20 + i * 40}, 300 ${110 + i * 36}, 460 ${50 + i * 39} S 720 ${90 + i * 37}, 840 ${40 + i * 40}`} fill="none" stroke="#D6C5A7" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="label mb-5">{o.kicker}</p>
            <SplitHeading className="h-display text-4xl leading-[1.02] md:text-7xl">{o.title}</SplitHeading>
          </div>
          <p className="max-w-xl font-serif text-xl leading-relaxed text-steel md:text-2xl">{o.body}</p>
        </div>

        <div className="mt-16 grid gap-14 md:mt-24 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* Map: sticky on desktop while the chapters scroll past */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100svh-8rem)] lg:self-start">
            <svg data-map viewBox="-10 -10 1020 1080" className="mx-auto h-full max-h-[80vh] w-full overflow-visible" role="img" aria-label={`${o.from} → ${o.farm} → ${o.to}`}>
              <defs>
                <radialGradient id="bo-fill" cx="0.62" cy="0.62" r="0.7">
                  <stop offset="0" stopColor="#7E2C3E" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#61212F" stopOpacity="0.12" />
                </radialGradient>
                <pattern id="bo-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1" fill="#D6C5A7" fillOpacity="0.16" />
                </pattern>
              </defs>
              {NEIGHBOURS.map((c) => (
                <path key={c.name} d={c.d} fill="url(#bo-dots)" stroke="#D6C5A7" strokeOpacity="0.18" strokeWidth="1" />
              ))}
              <path data-bo-fill d={BOLIVIA} fill="url(#bo-fill)" />
              <path data-bo-outline d={BOLIVIA} fill="none" stroke="#D6C5A7" strokeWidth="1.6" pathLength={1} strokeDasharray="1" />
              <text x="430" y="400" textAnchor="middle" className="fill-bone/15 font-display text-[78px] tracking-[0.3em]">BOLIVIA</text>
              <text x="930" y="240" textAnchor="middle" className="fill-champagne/40 font-display text-[40px] tracking-[0.35em]">{o.to.toUpperCase()}</text>
              <text x="760" y="1000" textAnchor="middle" className="fill-champagne/25 font-display text-[28px] tracking-[0.35em]">PARAGUAY</text>

              {/* route */}
              <path d={route} fill="none" stroke="#D6C5A7" strokeOpacity="0.15" strokeWidth="2" strokeDasharray="3 7" />
              <path data-route-path d={route} fill="none" stroke="#D6C5A7" strokeWidth="2.5" strokeLinecap="round" pathLength={1} strokeDasharray="1" />
              <text x={(P.sanJose[0] + P.robore[0]) / 2} y={P.robore[1] + 80} textAnchor="middle" className="fill-ash text-[17px] uppercase tracking-[0.25em]">
                {o.route}
              </text>
              {[
                { x: P.santaCruz[0], y: P.santaCruz[1], label: o.from, sub: "17.8° S · 63.2° W", main: false, below: true, anchor: "end" as const },
                { x: farm[0], y: farm[1], label: o.farm, sub: "Wangus", main: true, below: false, anchor: "middle" as const },
                { x: P.quijarro[0], y: P.quijarro[1], label: o.border, sub: o.borderSub, main: false, below: true, anchor: "end" as const },
              ].map((pt) => (
                <g key={pt.label}>
                  {pt.main && <circle cx={pt.x} cy={pt.y} r="24" fill="none" stroke="#7E2C3E" strokeWidth="1.5" className="origin-center animate-ping [transform-box:fill-box]" />}
                  <circle data-route-stop cx={pt.x} cy={pt.y} r={pt.main ? 11 : 7} fill={pt.main ? "#7E2C3E" : "#D6C5A7"} stroke="#D6C5A7" strokeWidth={pt.main ? 2.5 : 0} />
                  <g data-route-label>
                    <text x={pt.x} y={pt.y + (pt.below ? 44 : -62)} textAnchor={pt.anchor} className="fill-bone font-display text-[30px] tracking-[0.06em]">
                      {pt.label}
                    </text>
                    <text x={pt.x} y={pt.y + (pt.below ? 68 : -36)} textAnchor={pt.anchor} className="fill-champagne text-[16px] uppercase tracking-[0.3em]">
                      {pt.sub}
                    </text>
                  </g>
                </g>
              ))}
              {/* compass */}
              <g transform="translate(110 980)" className="fill-none stroke-champagne/40">
                <circle r="22" />
                <path d="M0 -30 L 5 0 L 0 30 L -5 0 Z" className="fill-champagne/30" />
                <text y="-38" textAnchor="middle" className="fill-champagne/60 stroke-none text-[12px]">N</text>
              </g>
            </svg>
          </div>

          {/* Chapters */}
          <ol data-chapters className="space-y-20 md:space-y-28">
            {o.points.map((pt, i) => (
              <li key={pt.t} data-chapter>
                <div data-ch-img className="relative aspect-[4/3] overflow-hidden">
                  <Image src={chapters[i].src} alt={pt.t} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-transparent" />
                  <span className="absolute left-5 top-4 font-display text-6xl text-bone/90 md:text-7xl">0{i + 1}</span>
                  {chapters[i].credit && <span className="absolute bottom-2 right-3 text-[0.55rem] text-bone/40">{chapters[i].credit}</span>}
                </div>
                <div data-ch-text className="mt-6 grid gap-3">
                  <h3 className="h-display text-2xl md:text-3xl">{pt.t}</h3>
                  <p className="font-serif text-lg leading-relaxed text-steel md:text-xl">{pt.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <dl className="mt-24 grid gap-px bg-champagne/10 md:mt-32 md:grid-cols-3">
          {o.stats.map((st) => (
            <div key={st.l} className="bg-noir p-6 md:p-10">
              <dt className="sr-only">{st.l}</dt>
              <dd className="font-display text-5xl text-champagne md:text-6xl">
                {st.pre}
                <span data-stat={st.n}>{st.n}</span>
                {st.suf}
              </dd>
              <dd className="mt-3 max-w-[16rem] text-sm leading-relaxed text-steel">{st.l}</dd>
            </div>
          ))}
        </dl>
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

/** One panel per step: the butcher with the meat, the ageing room, the knife, the sealed pack, the route home. */
function processPanels(d: Dict, sizes: string) {
  const photo = (ph: { src: string }, alt: string) => (
    <>
      <Image data-pzoom src={ph.src} alt={alt} fill sizes={sizes} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-noir/50 to-transparent" />
    </>
  );
  const s = d.process.steps;
  return [
    photo(SCENES.butcher, s[0].t),
    photo(SCENES.aging, s[1].t),
    photo(SCENES.slicing, s[2].t),
    <VacuumVisual key="vac" />,
    <DeliveryVisual key="del" label={d.delivery.kicker} cold={d.process.cold} />,
  ];
}

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
            .fromTo(img.querySelector("[data-pzoom]"), { scale: 1.4 }, { scale: 1, ease: "power3.out", duration: 1 }, i)
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
          {processPanels(d, "50vw").map((panel, i) => (
            <div key={i} data-pimg className="absolute inset-0 overflow-hidden">
              {panel}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {processPanels(d, "50vw").map((panel, i) => (
            <div key={i} className={`relative overflow-hidden ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}>
              {panel}
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
