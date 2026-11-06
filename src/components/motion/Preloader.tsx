"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, LOADED_EVENT, prefersReducedMotion } from "@/lib/gsap";

/**
 * Intro on every full page load: the logo draws in and the counter runs to 100, then a butcher's knife
 * is thrown in end over end, sticks point-first in the middle of the logo, and the logo splits in half
 * along the blade and falls away before the curtain lifts.
 * Client-side navigation keeps the layout mounted, so it only plays on a real load / refresh.
 */

/** Lean of the stuck knife (and of the split through the logo), in degrees from vertical; handle to the upper right. */
const LEAN = 18;
/** Assumed logo block height for the server-rendered clip; the effect re-measures it. */
const LOGO_H = 196;

/* Knife drawing, in its own SVG units: drawn upright, handle at the top, point at the bottom. */
const KNIFE_W = 120;
const KNIFE_H = 560;
/** The point: it lands on the centre of the logo. */
const TIP: [number, number] = [31, 556];
/** Balance point, about where the blade meets the bolster: the knife spins around it in flight. */
const COM: [number, number] = [56, 250];
/** How many end-over-end turns it makes in the air. */
const SPINS = 2;
/** How deep the point sinks into the logo, in knife units: that much of the blade is hidden once it sticks. */
const SINK = 34;

const splitDx = (h: number) => (h / 2) * Math.tan((LEAN * Math.PI) / 180);
/** Clip polygons for the two halves of the logo, cut along a line through its centre at LEAN degrees. */
const halfClips = (dx: number) => ({
  a: `polygon(0 0, calc(50% + ${dx}px) 0, calc(50% - ${dx}px) 100%, 0 100%)`,
  b: `polygon(calc(50% + ${dx}px) 0, 100% 0, 100% 100%, calc(50% - ${dx}px) 100%)`,
});

function Logo() {
  const word = "DON CORTE FINO";
  return (
    <div className="flex flex-col items-center px-6">
      <svg viewBox="0 0 120 120" className="h-28 w-28">
        {/* bull horn + head + cleaver, traced loosely from the logo */}
        <path data-draw data-fill d="M30 20 C 18 40, 28 60, 50 62 L 62 64 L 60 90 L 52 100 L 46 92 L 38 70 C 26 64, 16 46, 30 20 Z" fill="#61212F" fillOpacity="0" stroke="#7E2C3E" strokeWidth="1.2" strokeDasharray="600" />
        <path data-draw d="M66 30 L 86 22 L 98 44 L 82 62 L 76 98 L 70 98 L 72 62 Z" fill="none" stroke="#D6C5A7" strokeWidth="1.2" strokeDasharray="600" />
        <path data-draw d="M80 30 L 90 46 M 76 40 L 86 54" stroke="#D6C5A7" strokeWidth="1" strokeDasharray="600" />
      </svg>
      <div className="mt-6 overflow-hidden whitespace-nowrap font-display text-2xl tracking-[0.3em] text-bone">
        {word.split("").map((c, i) => (
          <span key={i} data-letter className="inline-block">
            {c === " " ? "\u00a0" : c}
          </span>
        ))}
      </div>
      <p className="mt-3 whitespace-nowrap text-[0.6rem] uppercase tracking-[0.5em] text-champagne">Wangus · Wagyu × Angus</p>
    </div>
  );
}

/**
 * A butcher's breaking knife: long steel blade with a ground edge bevel and an upswept point, a steel
 * bolster, and a riveted rosewood handle.
 */
function Knife({ id }: { id: string }) {
  const u = (k: string) => `url(#${id}-${k})`;
  // Spine runs straight down the left; the edge on the right sweeps in to an upswept point by the spine.
  const blade = "M27 216 L 93 216 L 95 300 Q 98 420 74 488 Q 56 534 31 556 Q 36 500 31 430 Z";
  const bevel = "M84 216 L 93 216 L 95 300 Q 98 420 74 488 Q 56 534 31 556 Q 46 528 60 486 Q 82 420 82 300 Z";
  const handle = "M34 8 Q 55 0 76 8 Q 84 60 82 120 Q 80 170 84 204 L 26 204 Q 30 170 28 120 Q 26 60 34 8 Z";
  return (
    <svg viewBox={`0 0 ${KNIFE_W} ${KNIFE_H}`} width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a130b" />
          <stop offset="0.3" stopColor="#6b2f1a" />
          <stop offset="0.5" stopColor="#8a4126" />
          <stop offset="0.75" stopColor="#5a2614" />
          <stop offset="1" stopColor="#1e0d07" />
        </linearGradient>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.5 0.012" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.04  0 0 0 0 0.02  0 0 0 2.4 -1" />
        </filter>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa3ab" />
          <stop offset="0.15" stopColor="#c9d0d6" />
          <stop offset="0.55" stopColor="#7d868e" />
          <stop offset="1" stopColor="#59616a" />
        </linearGradient>
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8f989f" />
          <stop offset="0.6" stopColor="#e9eef2" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="0.58" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-bolster`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b636b" />
          <stop offset="0.4" stopColor="#d5dbe0" />
          <stop offset="1" stopColor="#4a5158" />
        </linearGradient>
        <clipPath id={`${id}-hclip`}>
          <path d={handle} />
        </clipPath>
      </defs>

      {/* handle: rosewood scales with grain, a highlight and three steel rivets */}
      <path d={handle} fill={u("wood")} />
      <g clipPath={u("hclip")}>
        <rect x="20" y="0" width="70" height="210" filter={u("grain")} opacity="0.9" />
        <path d="M44 14 Q 40 100 42 196" stroke="#e0a07a" strokeOpacity="0.28" strokeWidth="4" fill="none" />
      </g>
      {[52, 110, 168].map((y) => (
        <g key={y}>
          <circle cx="55" cy={y} r="7" fill="#b9c1c8" />
          <circle cx="55" cy={y} r="7" fill="none" stroke="#3b4046" strokeWidth="1.5" />
          <circle cx="53" cy={y - 2} r="2.4" fill="#fff" opacity="0.7" />
        </g>
      ))}
      {/* bolster */}
      <rect x="23" y="200" width="74" height="20" rx="4" fill={u("bolster")} />
      <path d="M25 219 L 95 219" stroke="#2c3136" strokeWidth="1.5" />

      {/* blade */}
      <path d={blade} fill={u("steel")} />
      <path d={bevel} fill={u("bevel")} />
      <path d={blade} fill={u("sheen")} />
      {/* spine catches the light; the edge is a bright hairline */}
      <path d="M27 218 L 31 430 Q 36 500 31 554" stroke="#eef2f5" strokeOpacity="0.8" strokeWidth="1.6" fill="none" />
      <path d="M93 216 L 95 300 Q 98 420 74 488 Q 56 534 31 556" stroke="#fff" strokeWidth="1.4" fill="none" />
      {/* maker's mark */}
      <text x="52" y="262" textAnchor="middle" fontSize="11" fill="#3b4046" fontFamily="serif" letterSpacing="1.5" opacity="0.7">
        DCF
      </text>
    </svg>
  );
}

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const finish = () => {
      setDone(true);
      window.dispatchEvent(new Event(LOADED_EVENT));
      (window as unknown as { __dcfLoaded?: boolean }).__dcfLoaded = true;
    };
    if (prefersReducedMotion() || !root.current) {
      finish();
      return;
    }

    const el = root.current;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const lean = (LEAN * Math.PI) / 180;

    // The cut runs through the centre of the logo block; re-clip the halves to its real height.
    const logo = el.querySelector<HTMLElement>("[data-logo]")!;
    const lb = logo.getBoundingClientRect();
    const cx = lb.left + lb.width / 2;
    const cy = lb.top + lb.height / 2;
    const clips = halfClips(splitDx(lb.height));
    gsap.set("[data-half='a']", { clipPath: clips.a });
    gsap.set("[data-half='b']", { clipPath: clips.b });
    gsap.set("[data-crack]", { left: cx, top: cy - lb.height * 0.75, height: lb.height * 1.5, rotation: LEAN, transformOrigin: "50% 50%" });
    gsap.set("[data-crack-core], [data-crack-glow]", { scaleY: 0 });
    gsap.set("[data-dent]", { left: cx, top: cy, opacity: 0, scale: 0 });

    // Knife size: long enough to read as a big butcher's knife, but in proportion to the logo on phones.
    const s = Math.min((H * 0.44) / KNIFE_H, (W * 0.26) / KNIFE_W, 0.8);
    const knives = el.querySelectorAll<HTMLElement>("[data-knife]");
    // Each knife box is placed so its balance point sits at (0,0); x/y then move the balance point.
    gsap.set(knives, {
      left: -COM[0] * s,
      top: -COM[1] * s,
      width: KNIFE_W * s,
      height: KNIFE_H * s,
      transformOrigin: `${COM[0] * s}px ${COM[1] * s}px`,
    });
    // Where the balance point must be when it lands so that the blade enters the logo exactly at its
    // centre, with the last SINK units of the point buried (hidden by a mask) beyond it.
    const rot = (x: number, y: number, a: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    const ENTRY: [number, number] = [TIP[0], TIP[1] - SINK];
    const [tx, ty] = rot((ENTRY[0] - COM[0]) * s, (ENTRY[1] - COM[1]) * s, lean);
    const end = { x: cx - tx, y: cy - ty };
    // Thrown from off the lower left, on a gentle arc
    const start = { x: -KNIFE_H * s * 0.6, y: H * 0.85 };

    const flight = { p: 0, wob: 0 };
    let lastRot = 0;
    const list = Array.from(knives);
    const main = list[list.length - 1];
    const trails = list.slice(0, -1).reverse();
    const pose = () => {
      const p = flight.p;
      const x = start.x + (end.x - start.x) * p;
      const y = start.y + (end.y - start.y) * p - Math.sin(Math.PI * p) * H * 0.22;
      const r = LEAN - (1 - p) * SPINS * 360 + flight.wob;
      const v = r - lastRot;
      lastRot = r;
      gsap.set(main, { x, y, rotation: r });
      trails.forEach((tr, i) => {
        const lag = -v * (i + 1) * 0.8;
        gsap.set(tr, { x, y, rotation: r + lag, opacity: p > 0 && p < 1 ? Math.min(0.35, Math.abs(v) * 0.012) / (i + 1) : 0 });
      });
    };
    pose();

    // The stuck knife quivers around where it went in, not around its balance point
    const quiver = () => {
      const [qx, qy] = rot((ENTRY[0] - COM[0]) * s, (ENTRY[1] - COM[1]) * s, ((LEAN + flight.wob) * Math.PI) / 180);
      gsap.set(main, { x: cx - qx, y: cy - qy, rotation: LEAN + flight.wob });
    };

    const sparks = Array.from(el.querySelectorAll<HTMLElement>("[data-spark]"));
    gsap.set(sparks, { left: cx, top: cy, opacity: 0 });

    const cutAt = ((ENTRY[1] / KNIFE_H) * 100).toFixed(1);
    const buried = `linear-gradient(to bottom, #000 ${cutAt}%, transparent ${cutAt}%)`;

    const counter = { v: 0 };
    const nums = el.querySelectorAll<HTMLElement>("[data-count]");
    const tl = gsap.timeline({ onComplete: finish });
    tl
      .fromTo(el.querySelectorAll("[data-draw]"), { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", stagger: 0.12 })
      .to(counter, { v: 100, duration: 1.7, ease: "power3.inOut", onUpdate: () => nums.forEach((n) => (n.textContent = String(Math.round(counter.v)).padStart(3, "0"))) }, 0)
      .from(el.querySelectorAll("[data-letter]"), { yPercent: 120, duration: 0.9, stagger: 0.035 }, 0.4)
      .to(el.querySelectorAll("[data-fill]"), { fillOpacity: 1, duration: 0.6 }, 1.2)

      // The knife is thrown in, turning end over end…
      .addLabel("throw", 1.5)
      .set(knives, { autoAlpha: 1 }, "throw")
      .to(flight, { p: 1, duration: 0.62, ease: "power1.out", onUpdate: pose }, "throw")
      // …and sticks, point first, in the middle of the logo.
      .addLabel("hit", "throw+=0.62")
      .set(trails, { autoAlpha: 0 }, "hit")
      // the point disappears into the logo
      .set(main, { maskImage: buried, WebkitMaskImage: buried }, "hit")
      .to(flight, { wob: 7, duration: 0.045, ease: "sine.out", onUpdate: quiver }, "hit")
      .to(flight, { keyframes: { wob: [-5, 3.5, -2.2, 1.2, -0.5, 0] }, duration: 0.5, ease: "none", onUpdate: quiver }, "hit+=0.045")
      .to("[data-shake]", { x: "+=6", y: "+=4", duration: 0.04, yoyo: true, repeat: 3, ease: "none" }, "hit")
      .fromTo("[data-flash]", { opacity: 0 }, { opacity: 0.18, duration: 0.05, yoyo: true, repeat: 1, ease: "none" }, "hit")
      .fromTo("[data-dent]", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "expo.out" }, "hit")
      // a hairline crack runs out from the point along the blade's line, through the whole logo
      .fromTo("[data-crack-core]", { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: "power3.out" }, "hit+=0.12")
      .fromTo("[data-crack-glow]", { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.36, ease: "power3.out" }, "hit+=0.12");

    sparks.forEach((sp) => {
      const ang = gsap.utils.random(0, 360);
      const dist = gsap.utils.random(40, 170);
      const r = (ang * Math.PI) / 180;
      const dur = gsap.utils.random(0.35, 0.7);
      tl.set(sp, { rotation: ang, opacity: 1, x: 0, y: 0, scaleX: gsap.utils.random(0.5, 1.2) }, "hit")
        .to(sp, { x: Math.cos(r) * dist, duration: dur, ease: "power2.out" }, "hit")
        .to(sp, { y: Math.sin(r) * dist + gsap.utils.random(30, 110), duration: dur, ease: "power1.in" }, "hit")
        .to(sp, { opacity: 0, scaleX: 0.2, duration: dur * 0.5 }, `hit+=${dur * 0.5}`);
    });

    // Fall direction for each half: away from the cut, perpendicular to the blade
    const nx = Math.cos(lean);
    const ny = Math.sin(lean);
    tl
      // the logo comes apart along the cut and the halves drop away; the knife goes with them
      .addLabel("split", "hit+=0.55")
      .to("[data-crack], [data-dent]", { autoAlpha: 0, duration: 0.25 }, "split")
      .to("[data-seam]", { opacity: 1, duration: 0.25 }, "split")
      .to("[data-half='a']", { x: -nx * 46, y: -ny * 46, rotation: -6, duration: 0.45, ease: "power3.out" }, "split")
      .to("[data-half='b']", { x: nx * 46, y: ny * 46, rotation: 6, duration: 0.45, ease: "power3.out" }, "split")
      .to("[data-half='a']", { y: H * 0.6, rotation: -24, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, "split+=0.28")
      .to("[data-half='b']", { y: H * 0.6, rotation: 22, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, "split+=0.33")
      // the knife drops out of the cut, point first
      .set(main, { maskImage: "none", WebkitMaskImage: "none" }, "split+=0.12")
      .to(main, { y: `+=${H * 0.7}`, rotation: `-=${30}`, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, "split+=0.12")
      .to("[data-count]", { autoAlpha: 0, duration: 0.3 }, "split")
      // and the curtain lifts
      .addLabel("reveal", "split+=0.5")
      .to("[data-seam]", { opacity: 0, duration: 0.5 }, "reveal")
      .to("[data-curtain]", { autoAlpha: 0, duration: 0.65, ease: "power2.inOut" }, "reveal");

    // Let a test harness scrub the intro frame by frame
    if (new URLSearchParams(window.location.search).has("introdebug")) {
      tl.pause();
      (window as unknown as { __dcfIntro?: gsap.core.Timeline }).__dcfIntro = tl;
    }
    return () => {
      tl.kill();
    };
  }, []);

  if (done) return null;
  const clips = halfClips(splitDx(LOGO_H));
  return (
    // Visible from the server render so the page never flashes before the intro covers it
    <div ref={root} id="dcf-preloader" className="fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      <noscript>
        <style>{"#dcf-preloader{display:none}"}</style>
      </noscript>
      <div data-curtain className="absolute inset-0 bg-noir" />
      {/* burgundy glow that blooms behind the logo as it splits */}
      <div data-seam className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(126,44,62,0.5),transparent_55%)] opacity-0" />
      <div data-shake className="absolute inset-0">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* the logo, twice: each copy shows one side of the cut so they can fall apart */}
          <div data-logo className="relative">
            <div data-half="a" className="will-change-transform" style={{ clipPath: clips.a, transformOrigin: "35% 50%" }}>
              <Logo />
            </div>
            <div data-half="b" className="absolute inset-0 will-change-transform" style={{ clipPath: clips.b, transformOrigin: "65% 50%" }}>
              <Logo />
            </div>
          </div>
        </div>

        {/* the cut: a bright split along the blade's line and a glint where the point went in */}
        <div data-crack className="pointer-events-none absolute w-0">
          <div data-crack-glow className="absolute -left-[5px] top-0 h-full w-[10px] bg-[linear-gradient(180deg,transparent,rgba(255,226,190,0.5)_30%,rgba(255,240,220,0.85)_50%,rgba(255,226,190,0.5)_70%,transparent)] blur-md" />
          <div data-crack-core className="absolute -left-px top-0 h-full w-[2px] bg-[linear-gradient(180deg,transparent,#fff_25%,#fff_75%,transparent)] shadow-[0_0_12px_rgba(255,236,210,0.9)]" />
        </div>
        <div data-dent className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,240,220,0.8),rgba(126,44,62,0.35)_45%,transparent_70%)] opacity-0 blur-sm" />

        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            data-spark
            className="pointer-events-none absolute h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,#fff8e8,#ffc77a_45%,rgba(255,120,40,0))] opacity-0 shadow-[0_0_8px_rgba(255,190,110,0.9)]"
            style={{ width: 10 + ((i * 7) % 16) }}
          />
        ))}

        {/* the knife, with two motion-blur ghosts that trail it while it spins */}
        {[2, 1, 0].map((g) => (
          <div key={g} data-knife className={`pointer-events-none invisible absolute ${g ? "blur-[3px]" : "drop-shadow-[0_18px_24px_rgba(0,0,0,0.7)]"}`}>
            <Knife id={`dcf-knife-${g}`} />
          </div>
        ))}
      </div>
      <span data-count className="absolute bottom-8 right-8 font-display text-6xl text-bone/20 md:text-8xl">
        000
      </span>
      <div data-flash className="pointer-events-none absolute inset-0 bg-bone opacity-0" />
    </div>
  );
}
