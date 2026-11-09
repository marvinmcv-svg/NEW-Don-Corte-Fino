"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, LOADED_EVENT, prefersReducedMotion } from "@/lib/gsap";

/**
 * Intro on every full page load: the logo draws in, large, while the camera slowly pushes in. A butcher's
 * cleaver then spins out of the middle of the screen toward the viewer, buries its edge in the centre of
 * the logo, and the logo splits along the cut. The camera zooms through the split into the hero.
 * Client-side navigation keeps the layout mounted, so it only plays on a real load / refresh.
 */

/** Lean of the buried edge (and of the split through the logo), in degrees from vertical; handle to the upper right. */
const LEAN = 18;
/** Assumed logo block height for the server-rendered clip; the effect re-measures it. */
const LOGO_H = 290;

/*
 * Cleaver drawing, in its own SVG units, drawn lying down: blade on the left, handle to the right,
 * spine along the top and the cutting edge along the bottom. viewBox is 0 -10 520 200.
 */
const CL_W = 520;
const CL_H = 200;
const CL_Y0 = -10;
/** Balance point, just in front of the bolster: it spins around this in the air. */
const COM: [number, number] = [250, 70];
/** How much of the blade, measured up from the edge, is buried in the logo once it lands. */
const SINK = 30;
/** Where the buried edge meets the logo's centre: halfway along the blade, SINK above the edge. */
const ENTRY: [number, number] = [150, 172 - SINK];
/** How many turns it makes on its way out of the screen. */
const SPINS = 2.25;

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
      <svg viewBox="0 0 120 120" className="h-32 w-32 md:h-44 md:w-44">
        {/* bull horn + head + cleaver, traced loosely from the logo */}
        <path data-draw data-fill d="M30 20 C 18 40, 28 60, 50 62 L 62 64 L 60 90 L 52 100 L 46 92 L 38 70 C 26 64, 16 46, 30 20 Z" fill="#61212F" fillOpacity="0" stroke="#7E2C3E" strokeWidth="1.2" strokeDasharray="600" />
        <path data-draw d="M66 30 L 86 22 L 98 44 L 82 62 L 76 98 L 70 98 L 72 62 Z" fill="none" stroke="#D6C5A7" strokeWidth="1.2" strokeDasharray="600" />
        <path data-draw d="M80 30 L 90 46 M 76 40 L 86 54" stroke="#D6C5A7" strokeWidth="1" strokeDasharray="600" />
      </svg>
      <div className="mt-6 overflow-hidden whitespace-nowrap font-display text-[1.7rem] tracking-[0.28em] text-bone md:text-5xl">
        {word.split("").map((c, i) => (
          <span key={i} data-letter className={`inline-block ${i < 3 ? "text-champagne" : ""}`}>
            {c === " " ? " " : c}
          </span>
        ))}
      </div>
      <p className="mt-4 whitespace-nowrap text-[0.62rem] uppercase tracking-[0.5em] text-champagne md:text-xs">Wangus · Wagyu × Angus</p>
    </div>
  );
}

/**
 * A butcher's cleaver: a wide satin-steel blade with a hanging hole, a polished bolster and a full-tang
 * black handle with three steel slots.
 */
function Cleaver({ id }: { id: string }) {
  const u = (k: string) => `url(#${id}-${k})`;
  // Spine straight along the top, a gently bellied edge along the bottom, a rounded nose on the left
  const blade = "M14 0 L 300 0 L 300 44 Q 298 110 296 170 Q 150 178 16 176 Q 2 174 2 160 L 2 14 Q 2 0 14 0 Z";
  const bevel = "M296 140 Q 150 148 16 146 Q 4 146 3 150 L 3 160 Q 2 174 16 176 Q 150 178 296 170 Z";
  const handle = "M338 4 Q 430 -2 506 4 Q 520 6 520 22 Q 520 38 506 40 Q 430 46 338 42 Z";
  return (
    <svg viewBox={`0 ${CL_Y0} ${CL_W} ${CL_H}`} width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#e3e7ea" />
          <stop offset="0.35" stopColor="#c3c9ce" />
          <stop offset="0.7" stopColor="#a7aeb4" />
          <stop offset="1" stopColor="#c9ced2" />
        </linearGradient>
        <linearGradient id={`${id}-brush`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9dee2" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.48" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.56" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f7" />
          <stop offset="0.45" stopColor="#9aa2a9" />
          <stop offset="0.7" stopColor="#e6eaed" />
          <stop offset="1" stopColor="#7b838a" />
        </linearGradient>
        <linearGradient id={`${id}-grip`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3d41" />
          <stop offset="0.3" stopColor="#141517" />
          <stop offset="1" stopColor="#050506" />
        </linearGradient>
        <mask id={`${id}-hole`}>
          <rect x="0" y={CL_Y0} width={CL_W} height={CL_H} fill="#fff" />
          <circle cx="30" cy="30" r="10" fill="#000" />
        </mask>
      </defs>

      {/* blade */}
      <g mask={u("hole")}>
        <path d={blade} fill={u("steel")} />
        <path d={blade} fill={u("brush")} />
        <path d={bevel} fill={u("bevel")} />
        <path d={blade} fill={u("sheen")} />
      </g>
      <circle cx="30" cy="30" r="10" fill="none" stroke="#7b838a" strokeWidth="1.5" />
      <path d="M14 1 L 300 1" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.6" />
      <path d="M296 170 Q 150 178 16 176 Q 2 174 2 160" stroke="#ffffff" strokeWidth="1.4" fill="none" />
      {/* maker's mark */}
      <text x="262" y="34" textAnchor="middle" fontSize="13" fill="#6f777e" fontFamily="serif" letterSpacing="1" opacity="0.8">
        DCF
      </text>

      {/* bolster: polished steel that sweeps into the handle */}
      <path d="M298 -2 Q 322 -4 342 4 L 342 42 Q 322 50 300 46 Z" fill={u("chrome")} />
      {/* handle with the tang showing along its back and three steel slots */}
      <path d={handle} fill={u("grip")} />
      <path d="M338 41 Q 430 46 506 40" stroke="#c7cdd2" strokeWidth="2.5" fill="none" />
      <path d="M346 8 Q 430 3 500 8" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="3" fill="none" />
      {[420, 452, 484].map((x) => (
        <rect key={x} x={x} y="11" width="9" height="22" rx="4.5" fill={u("chrome")} />
      ))}
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
    // The cleaver lies along x in its drawing; turn it so the edge runs along the cut, handle up and right.
    const final = LEAN - 90;
    const rad = (d: number) => (d * Math.PI) / 180;

    // The cut runs through the centre of the logo block; re-clip the halves to its real height.
    const logo = el.querySelector<HTMLElement>("[data-logo]")!;
    const lb = logo.getBoundingClientRect();
    const cx = lb.left + lb.width / 2;
    const cy = lb.top + lb.height / 2;
    const clips = halfClips(splitDx(lb.height));
    gsap.set("[data-half='a']", { clipPath: clips.a });
    gsap.set("[data-half='b']", { clipPath: clips.b });
    gsap.set("[data-crack]", { left: cx, top: cy - lb.height * 0.7, height: lb.height * 1.4, rotation: LEAN, transformOrigin: "50% 50%" });
    gsap.set("[data-crack-core], [data-crack-glow]", { scaleY: 0 });
    gsap.set("[data-dent]", { left: cx, top: cy, opacity: 0, scale: 0 });
    // The camera zooms around the cut, so the zoom-through goes into the split
    gsap.set("[data-stage]", { transformOrigin: `${cx}px ${cy}px` });

    // Cleaver size: big enough to read across a room, never wider than the screen.
    const s = Math.min((W * 0.62) / CL_W, (H * 0.5) / CL_W, 0.95);
    const cleavers = el.querySelectorAll<HTMLElement>("[data-cleaver]");
    // Each cleaver box is placed so its balance point sits at (0,0); x/y then move the balance point.
    gsap.set(cleavers, {
      left: -COM[0] * s,
      top: -(COM[1] - CL_Y0) * s,
      width: CL_W * s,
      height: CL_H * s,
      transformOrigin: `${COM[0] * s}px ${(COM[1] - CL_Y0) * s}px`,
    });
    // Where the balance point must be when it lands so the buried edge passes through the logo's centre.
    const rot = (x: number, y: number, a: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    const [ex, ey] = rot((ENTRY[0] - COM[0]) * s, (ENTRY[1] - COM[1]) * s, rad(final));
    const end = { x: cx - ex, y: cy - ey };

    const flight = { p: 0, wob: 0 };
    let lastRot = final - SPINS * 360;
    const list = Array.from(cleavers);
    const main = list[list.length - 1];
    const trails = list.slice(0, -1).reverse();
    // Out of the middle of the screen: it starts tiny and far away, and spins toward you as it grows.
    const pose = () => {
      const p = flight.p;
      const x = cx + (end.x - cx) * p;
      const y = cy + (end.y - cy) * p;
      const scale = 0.06 + 0.94 * Math.pow(p, 1.7);
      const r = final - (1 - p) * SPINS * 360;
      const v = r - lastRot;
      lastRot = r;
      gsap.set(main, { x, y, rotation: r, scale });
      trails.forEach((tr, i) => {
        const lag = -v * (i + 1) * 0.8;
        gsap.set(tr, { x, y, scale, rotation: r + lag, opacity: p > 0 && p < 1 ? Math.min(0.4, Math.abs(v) * 0.02) / (i + 1) : 0 });
      });
    };
    pose();

    // Once it is in, it shudders around the cut, not around its balance point
    const quiver = () => {
      const [qx, qy] = rot((ENTRY[0] - COM[0]) * s, (ENTRY[1] - COM[1]) * s, rad(final + flight.wob));
      gsap.set(main, { x: cx - qx, y: cy - qy, rotation: final + flight.wob, scale: 1 });
    };

    const cutAt = (((ENTRY[1] - CL_Y0) / CL_H) * 100).toFixed(1);
    const buried = `linear-gradient(to bottom, #000 ${cutAt}%, transparent ${cutAt}%)`;

    const sparks = Array.from(el.querySelectorAll<HTMLElement>("[data-spark]"));
    gsap.set(sparks, { left: cx, top: cy, opacity: 0 });

    const counter = { v: 0 };
    const nums = el.querySelectorAll<HTMLElement>("[data-count]");
    const tl = gsap.timeline({ onComplete: finish });
    tl
      // The logo draws in while the camera slowly pushes in on it
      .fromTo("[data-stage]", { scale: 0.82 }, { scale: 1, duration: 2.2, ease: "power2.out" }, 0)
      .fromTo(el.querySelectorAll("[data-draw]"), { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.12 }, 0)
      .to(counter, { v: 100, duration: 1.6, ease: "power3.inOut", onUpdate: () => nums.forEach((n) => (n.textContent = String(Math.round(counter.v)).padStart(3, "0"))) }, 0)
      .from(el.querySelectorAll("[data-letter]"), { yPercent: 120, duration: 0.9, stagger: 0.035 }, 0.35)
      .to(el.querySelectorAll("[data-fill]"), { fillOpacity: 1, duration: 0.6 }, 1.1)

      // The cleaver spins out of the middle of the screen, toward you…
      .addLabel("throw", 1.45)
      .set(cleavers, { autoAlpha: 1 }, "throw")
      .to(flight, { p: 1, duration: 0.72, ease: "power1.in", onUpdate: pose }, "throw")
      // …and buries its edge in the centre of the logo.
      .addLabel("hit", "throw+=0.72")
      .set(trails, { autoAlpha: 0 }, "hit")
      .set(main, { maskImage: buried, WebkitMaskImage: buried }, "hit")
      .to(flight, { wob: 4, duration: 0.04, ease: "sine.out", onUpdate: quiver }, "hit")
      .to(flight, { keyframes: { wob: [-3, 2, -1.2, 0.6, 0] }, duration: 0.42, ease: "none", onUpdate: quiver }, "hit+=0.04")
      .to("[data-shake]", { x: "+=8", y: "+=5", duration: 0.04, yoyo: true, repeat: 3, ease: "none" }, "hit")
      .fromTo("[data-flash]", { opacity: 0 }, { opacity: 0.2, duration: 0.05, yoyo: true, repeat: 1, ease: "none" }, "hit")
      .fromTo("[data-dent]", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "expo.out" }, "hit")
      // a hairline crack runs out along the cut, through the whole logo
      .fromTo("[data-crack-core]", { scaleY: 0 }, { scaleY: 1, duration: 0.28, ease: "power3.out" }, "hit+=0.08")
      .fromTo("[data-crack-glow]", { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.34, ease: "power3.out" }, "hit+=0.08");

    sparks.forEach((sp) => {
      const ang = gsap.utils.random(0, 360);
      const dist = gsap.utils.random(50, 200);
      const r = rad(ang);
      const dur = gsap.utils.random(0.35, 0.7);
      tl.set(sp, { rotation: ang, opacity: 1, x: 0, y: 0, scaleX: gsap.utils.random(0.5, 1.2) }, "hit")
        .to(sp, { x: Math.cos(r) * dist, duration: dur, ease: "power2.out" }, "hit")
        .to(sp, { y: Math.sin(r) * dist + gsap.utils.random(30, 110), duration: dur, ease: "power1.in" }, "hit")
        .to(sp, { opacity: 0, scaleX: 0.2, duration: dur * 0.5 }, `hit+=${dur * 0.5}`);
    });

    // The halves part away from the cut, perpendicular to it
    const nx = Math.cos(rad(LEAN));
    const ny = Math.sin(rad(LEAN));
    tl
      .addLabel("split", "hit+=0.5")
      .to("[data-crack], [data-dent]", { autoAlpha: 0, duration: 0.25 }, "split")
      .to("[data-seam]", { opacity: 1, duration: 0.3 }, "split")
      .to("[data-half='a']", { x: -nx * 40, y: -ny * 40, rotation: -4, duration: 0.5, ease: "power3.out" }, "split")
      .to("[data-half='b']", { x: nx * 40, y: ny * 40, rotation: 4, duration: 0.5, ease: "power3.out" }, "split")
      .to(main, { x: `-=${nx * 40}`, y: `-=${ny * 40}`, rotation: `-=${4}`, duration: 0.5, ease: "power3.out" }, "split")
      .to("[data-count]", { autoAlpha: 0, duration: 0.3 }, "split")
      // …then the camera rushes in through the split, into the page
      .addLabel("zoom", "split+=0.35")
      .to("[data-stage]", { scale: 9, duration: 0.85, ease: "power3.in" }, "zoom")
      .to("[data-stage]", { autoAlpha: 0, duration: 0.35, ease: "power1.in" }, "zoom+=0.5")
      .to("[data-seam]", { opacity: 0, duration: 0.45 }, "zoom+=0.45")
      .to("[data-curtain]", { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, "zoom+=0.5");

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
      <div data-seam className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(126,44,62,0.55),transparent_55%)] opacity-0" />
      <div data-shake className="absolute inset-0">
        <div data-stage className="absolute inset-0 will-change-transform">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* the logo, twice: each copy shows one side of the cut so they can part */}
            <div data-logo className="relative">
              <div data-half="a" className="will-change-transform" style={{ clipPath: clips.a, transformOrigin: "35% 50%" }}>
                <Logo />
              </div>
              <div data-half="b" className="absolute inset-0 will-change-transform" style={{ clipPath: clips.b, transformOrigin: "65% 50%" }}>
                <Logo />
              </div>
            </div>
          </div>

          {/* the cut: a bright split along the edge's line and a glint where the blade went in */}
          <div data-crack className="pointer-events-none absolute w-0">
            <div data-crack-glow className="absolute -left-[5px] top-0 h-full w-[10px] bg-[linear-gradient(180deg,transparent,rgba(255,226,190,0.5)_30%,rgba(255,240,220,0.85)_50%,rgba(255,226,190,0.5)_70%,transparent)] blur-md" />
            <div data-crack-core className="absolute -left-px top-0 h-full w-[2px] bg-[linear-gradient(180deg,transparent,#fff_25%,#fff_75%,transparent)] shadow-[0_0_12px_rgba(255,236,210,0.9)]" />
          </div>
          <div data-dent className="pointer-events-none absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,240,220,0.8),rgba(126,44,62,0.35)_45%,transparent_70%)] opacity-0 blur-sm" />

          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              data-spark
              className="pointer-events-none absolute h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,#fff8e8,#ffc77a_45%,rgba(255,120,40,0))] opacity-0 shadow-[0_0_8px_rgba(255,190,110,0.9)]"
              style={{ width: 10 + ((i * 7) % 16) }}
            />
          ))}

          {/* the cleaver, with two motion-blur ghosts that trail it while it spins */}
          {[2, 1, 0].map((g) => (
            <div key={g} data-cleaver className={`pointer-events-none invisible absolute ${g ? "blur-[3px]" : "drop-shadow-[0_18px_24px_rgba(0,0,0,0.7)]"}`}>
              <Cleaver id={`dcf-cleaver-${g}`} />
            </div>
          ))}
        </div>
      </div>
      <span data-count className="absolute bottom-8 right-8 font-display text-6xl text-bone/20 md:text-8xl">
        000
      </span>
      <div data-flash className="pointer-events-none absolute inset-0 bg-bone opacity-0" />
    </div>
  );
}
