"use client";

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import HeroGL from "@/components/motion/HeroGL";
import Magnetic from "@/components/motion/Magnetic";
import { SplitHeading } from "@/components/motion/primitives";
import { DeliveryVisual, VacuumVisual } from "./ProcessVisuals";
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

      <div data-hero-content className="relative z-10 mx-auto flex h-full max-w-[1500px] flex-col justify-end px-4 pb-24 md:px-10 md:pb-20">
        <p data-hero-fade className="label mb-6">
          {d.hero.kicker}
        </p>
        <h1 ref={title} className="h-display max-w-6xl text-[13vw] leading-[0.92] md:text-[8.4vw] lg:text-[7.6vw]" style={{ perspective: 600 }}>
          {d.hero.title1} <span className="text-champagne">{d.hero.title2}</span>
        </h1>
        <div data-hero-rule className="gold-rule mt-10 max-w-6xl" />
        <div data-hero-fade className="mt-8">
          <Magnetic>
            <Link href={`/${locale}/cortes`} className="btn-primary">
              {d.hero.ctaCuts}
            </Link>
          </Magnetic>
        </div>
      </div>

      <div data-hero-fade className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 md:flex">
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
            <span className="h-display shrink-0 whitespace-nowrap text-3xl text-champagne md:text-4xl">= Wagus</span>
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

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: "[data-route]", start: "top 80%", end: "bottom 45%", scrub: 0.8 } });
      tl.fromTo("[data-route-path]", { strokeDashoffset: 1000 }, { strokeDashoffset: 0, ease: "none", duration: 1 })
        .from("[data-route-stop]", { scale: 0, transformOrigin: "center", stagger: 0.4, duration: 0.2, ease: "back.out(3)" }, 0)
        .from("[data-route-label]", { autoAlpha: 0, y: 16, stagger: 0.4, duration: 0.25 }, 0.05);
      gsap.from("[data-opoint]", { y: 50, autoAlpha: 0, stagger: 0.12, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: "[data-opoints]", start: "top 80%" } });
      gsap.to("[data-topo]", { yPercent: -12, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="origen" className="relative scroll-mt-20 overflow-hidden bg-noir px-4 py-28 md:px-10 md:py-40">
      {/* contour lines, like a survey map of the plains */}
      <svg data-topo aria-hidden="true" className="pointer-events-none absolute inset-0 h-[120%] w-full opacity-[0.07]" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
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

        <svg data-route viewBox="0 0 1000 160" className="mt-16 w-full overflow-visible md:mt-24" role="img" aria-label={`${o.from} → ${o.farm} → ${o.to}`}>
          <path data-route-path d="M40 110 C 220 30, 380 140, 520 80 S 820 40, 960 70" fill="none" stroke="#D6C5A7" strokeWidth="1.5" strokeDasharray="1000" />
          <path d="M960 70 L 1000 66" stroke="#D6C5A7" strokeOpacity=".4" strokeDasharray="4 6" />
          {[
            { x: 40, y: 110, label: o.from, sub: "17.8° S · 63.2° W", main: false, anchor: "start" as const },
            { x: 520, y: 80, label: o.farm, sub: "Wagus", main: true, anchor: "middle" as const },
            { x: 960, y: 70, label: o.to, sub: "→", main: false, anchor: "end" as const },
          ].map((p) => (
            <g key={p.label}>
              {p.main && (
                <circle cx={p.x} cy={p.y} r="22" fill="none" stroke="#7E2C3E" strokeWidth="1.5" className="origin-center animate-ping [transform-box:fill-box]" />
              )}
              <circle data-route-stop cx={p.x} cy={p.y} r={p.main ? 10 : 6} fill={p.main ? "#7E2C3E" : "#D6C5A7"} stroke="#D6C5A7" strokeWidth={p.main ? 2 : 0} />
              <g data-route-label>
                <text x={p.anchor === "start" ? p.x - 6 : p.anchor === "end" ? p.x + 6 : p.x} y={p.y + (p.main ? -34 : 38)} textAnchor={p.anchor} className="fill-bone font-display text-[22px] tracking-[0.08em]">
                  {p.label}
                </text>
                <text x={p.anchor === "start" ? p.x - 6 : p.anchor === "end" ? p.x + 6 : p.x} y={p.y + (p.main ? -14 : 58)} textAnchor={p.anchor} className="fill-champagne text-[12px] uppercase tracking-[0.3em]">
                  {p.sub}
                </text>
              </g>
            </g>
          ))}
        </svg>

        <ol data-opoints className="mt-16 grid gap-px bg-champagne/10 md:mt-24 md:grid-cols-3">
          {o.points.map((pt, i) => (
            <li key={pt.t} data-opoint className="bg-noir p-6 md:p-10">
              <span className="font-display text-sm text-champagne">0{i + 1}</span>
              <h3 className="h-display mt-4 text-2xl md:text-3xl">{pt.t}</h3>
              <p className="mt-3 leading-relaxed text-steel">{pt.d}</p>
            </li>
          ))}
        </ol>
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
