"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, LOADED_EVENT, prefersReducedMotion } from "@/lib/gsap";

/**
 * Intro on every full page load: the logo draws in and the counter runs to 100, then a butcher's axe
 * swings in, bites into the screen with a shower of sparks, and the two halves fall apart along the chop.
 * Client-side navigation keeps the layout mounted, so it only plays on a real load / refresh.
 */

/** Tilt of the chop line from vertical, in degrees (top leans right). */
const TILT = 7;

/* Axe drawing, in its own SVG units. Blade edge on the left, handle hanging down to the grip. */
const AXE_W = 320;
const AXE_H = 780;
/** Where the hands hold it: the swing pivots here. */
const PIVOT: [number, number] = [214, 735];
/** Middle of the cutting edge: this is the point that lands on the screen's centre. */
const EDGE: [number, number] = [22, 104];

function Panel() {
  const word = "DON CORTE FINO";
  return (
    <>
      <div data-inner className="relative flex flex-col items-center">
        <svg viewBox="0 0 120 120" className="h-28 w-28">
          {/* bull horn + head + cleaver, traced loosely from the logo */}
          <path data-draw data-fill d="M30 20 C 18 40, 28 60, 50 62 L 62 64 L 60 90 L 52 100 L 46 92 L 38 70 C 26 64, 16 46, 30 20 Z" fill="#61212F" fillOpacity="0" stroke="#7E2C3E" strokeWidth="1.2" strokeDasharray="600" />
          <path data-draw d="M66 30 L 86 22 L 98 44 L 82 62 L 76 98 L 70 98 L 72 62 Z" fill="none" stroke="#D6C5A7" strokeWidth="1.2" strokeDasharray="600" />
          <path data-draw d="M80 30 L 90 46 M 76 40 L 86 54" stroke="#D6C5A7" strokeWidth="1" strokeDasharray="600" />
        </svg>
        <div className="mt-6 overflow-hidden font-display text-2xl tracking-[0.3em] text-bone">
          {word.split("").map((c, i) => (
            <span key={i} data-letter className="inline-block">
              {c === " " ? " " : c}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.5em] text-champagne">Wangus · Wagyu × Angus</p>
      </div>
      <span data-count className="absolute bottom-8 right-8 font-display text-6xl text-bone/20 md:text-8xl">
        000
      </span>
    </>
  );
}

/**
 * A forged butcher's axe: blackened steel head with a ground, mirror-bright bevel, hammer marks,
 * a hickory handle with real grain, a wedge in the eye and a leather-wrapped grip.
 */
function Axe({ id }: { id: string }) {
  const u = (k: string) => `url(#${id}-${k})`;
  // Head outline: bearded blade sweeping to a curved edge on the left, eye and flat poll on the right
  const head = "M246 30 L 250 128 Q 236 136 214 134 L 168 132 Q 120 140 86 176 Q 60 198 26 196 Q 14 150 18 104 Q 20 52 34 10 Q 70 16 104 34 Q 140 52 170 34 L 214 26 Q 236 24 246 30 Z";
  const bevel = "M34 10 Q 20 52 18 104 Q 14 150 26 196 Q 44 196 56 190 Q 46 150 46 104 Q 48 58 60 18 Q 46 12 34 10 Z";
  const handle = "M196 120 Q 190 260 200 420 Q 210 560 200 700 Q 198 748 214 762 Q 236 770 244 752 Q 252 700 238 560 Q 226 420 236 260 Q 240 180 236 120 Z";
  return (
    <svg viewBox={`0 0 ${AXE_W} ${AXE_H}`} width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a2c16" />
          <stop offset="0.28" stopColor="#9a6534" />
          <stop offset="0.5" stopColor="#c48d52" />
          <stop offset="0.72" stopColor="#8d5a2c" />
          <stop offset="1" stopColor="#3a2210" />
        </linearGradient>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55 0.008" numOctaves="3" seed="4" />
          <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 0 0.03  0 0 0 2.2 -0.9" />
        </filter>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#5a6168" />
          <stop offset="0.35" stopColor="#2b2f34" />
          <stop offset="0.7" stopColor="#1a1d20" />
          <stop offset="1" stopColor="#3b4046" />
        </linearGradient>
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.25" stopColor="#e6ebef" />
          <stop offset="0.6" stopColor="#a9b2ba" />
          <stop offset="1" stopColor="#6d757d" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.56" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-hammer`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.62" />
        </filter>
        <linearGradient id={`${id}-wrap`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0d0b0a" />
          <stop offset="0.5" stopColor="#2b2420" />
          <stop offset="1" stopColor="#0d0b0a" />
        </linearGradient>
        <clipPath id={`${id}-hclip`}>
          <path d={handle} />
        </clipPath>
        <clipPath id={`${id}-sclip`}>
          <path d={head} />
        </clipPath>
      </defs>

      {/* handle */}
      <path d={handle} fill={u("wood")} />
      <g clipPath={u("hclip")}>
        <rect x="180" y="110" width="80" height="670" filter={u("grain")} opacity="0.85" />
        {/* long highlight down the rounded front of the handle */}
        <path d="M218 140 Q 212 300 220 430 Q 228 560 222 700" stroke="#f3cf9a" strokeOpacity="0.35" strokeWidth="5" fill="none" />
        {/* leather grip with spiral wrap */}
        <rect x="180" y="600" width="80" height="140" fill={u("wrap")} />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M180 ${606 + i * 12.5} L 260 ${596 + i * 12.5}`} stroke="#000" strokeOpacity="0.7" strokeWidth="2" />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M180 ${609 + i * 12.5} L 260 ${599 + i * 12.5}`} stroke="#6b5a4d" strokeOpacity="0.35" strokeWidth="1" />
        ))}
      </g>
      {/* knob at the end */}
      <ellipse cx="229" cy="757" rx="20" ry="11" fill="#2e1a0c" />

      {/* steel head */}
      <path d={head} fill={u("steel")} />
      <g clipPath={u("sclip")}>
        <rect x="0" y="0" width="260" height="210" filter={u("hammer")} opacity="0.12" />
        {/* forge scale darkening toward the eye */}
        <ellipse cx="208" cy="80" rx="60" ry="70" fill="#0b0c0e" opacity="0.45" />
        {/* top chamfer catching the light */}
        <path d="M34 10 Q 70 16 104 34 Q 140 52 170 34 L 214 26 Q 236 24 246 30" stroke="#9aa3ab" strokeOpacity="0.8" strokeWidth="3" fill="none" />
        {/* lower beard edge in shadow */}
        <path d="M250 128 Q 236 136 214 134 L 168 132 Q 120 140 86 176 Q 60 198 26 196" stroke="#000" strokeOpacity="0.6" strokeWidth="4" fill="none" />
      </g>
      {/* ground bevel along the edge */}
      <path d={bevel} fill={u("bevel")} />
      <path d={bevel} fill={u("sheen")} data-sheen />
      <path d="M34 10 Q 20 52 18 104 Q 14 150 26 196" stroke="#fff" strokeWidth="1.6" fill="none" />
      <path d="M60 18 Q 48 58 46 104 Q 46 150 56 190" stroke="#4a5158" strokeWidth="1.2" fill="none" opacity="0.8" />
      {/* eye: wooden handle end and steel wedge */}
      <rect x="198" y="24" width="38" height="8" rx="2" fill="#b07a42" />
      <path d="M217 23 L 217 33" stroke="#cfd5da" strokeWidth="2.5" />
      {/* maker's stamp */}
      <g opacity="0.55">
        <circle cx="132" cy="92" r="16" fill="none" stroke="#8b939b" strokeWidth="1.2" />
        <text x="132" y="96" textAnchor="middle" fontSize="11" fill="#8b939b" fontFamily="serif" letterSpacing="1">DCF</text>
      </g>
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
    const cx = W / 2;
    const cy = H / 2;
    const t = (TILT * Math.PI) / 180;

    // Size the axe to the screen and park it so that, at the moment of impact, the middle of its
    // edge sits on the centre of the screen with the edge lying along the chop line.
    const s = Math.min((H * 0.92) / AXE_H, (W * 0.9) / AXE_W, 1.25);
    const ex = (EDGE[0] - PIVOT[0]) * s;
    const ey = (EDGE[1] - PIVOT[1]) * s;
    const px = cx - (ex * Math.cos(t) - ey * Math.sin(t));
    const py = cy - (ex * Math.sin(t) + ey * Math.cos(t));
    const axes = el.querySelectorAll<HTMLElement>("[data-axe]");
    gsap.set(axes, {
      left: px - PIVOT[0] * s,
      top: py - PIVOT[1] * s,
      width: AXE_W * s,
      height: AXE_H * s,
      transformOrigin: `${PIVOT[0] * s}px ${PIVOT[1] * s}px`,
    });
    // The crack runs along the chop line through the centre
    const len = Math.hypot(W, H) * 1.2;
    gsap.set("[data-crack]", { left: cx, top: cy - len / 2, height: len, rotation: TILT, transformOrigin: "50% 50%" });
    gsap.set("[data-crack-core], [data-crack-glow]", { scaleY: 0 });
    gsap.set("[data-dent]", { opacity: 0, scale: 0 });

    // One value drives the swing; the trail copies lag behind it in proportion to the speed.
    const swing = { a: 64, x: W * 0.5, y: H * 0.45 };
    let last = swing.a;
    // DOM order is ghost 2, ghost 1, then the sharp axe on top
    const list = Array.from(axes);
    const main = list[list.length - 1];
    const trails = list.slice(0, -1).reverse();
    const pose = () => {
      const v = swing.a - last;
      last = swing.a;
      gsap.set(main, { rotation: swing.a, x: swing.x, y: swing.y });
      trails.forEach((tr, i) => {
        const lag = -v * (i + 1) * 0.9;
        gsap.set(tr, { rotation: swing.a + lag, x: swing.x, y: swing.y, opacity: Math.min(0.32, Math.abs(v) * 0.03) / (i + 1) });
      });
    };
    pose();

    // Sparks: short glowing streaks thrown out of the bite
    const sparks = Array.from(el.querySelectorAll<HTMLElement>("[data-spark]"));
    gsap.set(sparks, { left: cx, top: cy, opacity: 0 });

    const counter = { v: 0 };
    const nums = el.querySelectorAll<HTMLElement>("[data-count]");
    const tl = gsap.timeline({ onComplete: finish });
    tl
      .fromTo(el.querySelectorAll("[data-draw]"), { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", stagger: 0.12 })
      .to(counter, { v: 100, duration: 1.7, ease: "power3.inOut", onUpdate: () => nums.forEach((n) => (n.textContent = String(Math.round(counter.v)).padStart(3, "0"))) }, 0)
      .from(el.querySelectorAll("[data-letter]"), { yPercent: 120, duration: 0.9, stagger: 0.035 }, 0.4)
      .to(el.querySelectorAll("[data-fill]"), { fillOpacity: 1, duration: 0.6 }, 1.2)

      // The axe rises in from the lower right, already lifted…
      .addLabel("raise", 1.55)
      .set(axes, { autoAlpha: 1 }, "raise")
      .to(swing, { x: 0, y: 0, a: 78, duration: 0.6, ease: "power3.out", onUpdate: pose }, "raise")
      // …draws back for the blow (anticipation)…
      .to(swing, { a: 96, duration: 0.32, ease: "sine.inOut", onUpdate: pose }, "raise+=0.55")
      // …and comes down hard.
      .addLabel("swing", "raise+=0.88")
      .to(swing, { a: TILT, duration: 0.2, ease: "power4.in", onUpdate: pose }, "swing")
      .addLabel("hit", "swing+=0.2")
      .set(trails, { opacity: 0 }, "hit")
      // the blade bites and shudders
      .to(swing, { a: TILT - 1.6, duration: 0.05, ease: "power1.out", yoyo: true, repeat: 3, onUpdate: pose }, "hit")
      .to("[data-shake]", { x: "+=9", y: "+=7", duration: 0.04, yoyo: true, repeat: 5, ease: "none" }, "hit")
      .fromTo("[data-flash]", { opacity: 0 }, { opacity: 0.32, duration: 0.05, yoyo: true, repeat: 1, ease: "none" }, "hit")
      .fromTo("[data-crack-core]", { scaleY: 0 }, { scaleY: 1, duration: 0.32, ease: "power3.out" }, "hit")
      .fromTo("[data-crack-glow]", { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.4, ease: "power3.out" }, "hit")
      .fromTo("[data-dent]", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "expo.out" }, "hit");

    sparks.forEach((sp, i) => {
      // two fans: up-left and up-right of the edge, plus a few that drop
      const side = i % 2 ? 1 : -1;
      const ang = (side > 0 ? -20 : 200) + gsap.utils.random(-50, 50) + TILT;
      const dist = gsap.utils.random(90, 380);
      const r = (ang * Math.PI) / 180;
      const dur = gsap.utils.random(0.45, 0.9);
      tl.set(sp, { rotation: ang, opacity: 1, x: 0, y: gsap.utils.random(-60, 60), scaleX: gsap.utils.random(0.6, 1.4) }, "hit")
        .to(sp, { x: Math.cos(r) * dist, duration: dur, ease: "power2.out" }, "hit")
        .to(sp, { y: `+=${Math.sin(r) * dist + gsap.utils.random(40, 140)}`, duration: dur, ease: "power1.in" }, "hit")
        .to(sp, { opacity: 0, scaleX: 0.2, duration: dur * 0.5 }, `hit+=${dur * 0.5}`);
    });

    tl
      // beat, then the axe is wrenched out and leaves
      .addLabel("pull", "hit+=0.55")
      .to(swing, { a: 34, y: -H * 0.08, duration: 0.28, ease: "power2.in", onUpdate: pose }, "pull")
      .to(axes, { autoAlpha: 0, duration: 0.25 }, "pull+=0.12")
      // the two halves fall apart along the chop
      .addLabel("split", "pull+=0.18")
      .to("[data-crack], [data-dent]", { autoAlpha: 0, duration: 0.3 }, "split")
      .to("[data-half='a']", { xPercent: -62, rotation: -4, y: H * 0.05, duration: 1.15, ease: "expo.inOut" }, "split")
      .to("[data-half='b']", { xPercent: 62, rotation: 4, y: H * 0.05, duration: 1.15, ease: "expo.inOut" }, "split")
      .to("[data-seam]", { opacity: 0, duration: 0.9 }, "split+=0.3");

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
  // The chop line passes through the centre, tilted TILT degrees from vertical
  const off = 50 * Math.tan((TILT * Math.PI) / 180); // in % of height → approx % of width on landscape screens
  const left = `polygon(0 0, calc(50% + ${off}vh) 0, calc(50% - ${off}vh) 100%, 0 100%)`;
  const right = `polygon(calc(50% + ${off}vh) 0, 100% 0, 100% 100%, calc(50% - ${off}vh) 100%)`;
  return (
    // Visible from the server render so the page never flashes before the intro covers it
    <div ref={root} id="dcf-preloader" className="fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      <noscript>
        <style>{"#dcf-preloader{display:none}"}</style>
      </noscript>
      {/* burgundy glow that shows in the gap as the halves part */}
      <div data-seam className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(126,44,62,0.55),transparent_70%)]" />
      <div data-shake className="absolute inset-0">
        {[
          { k: "a", clip: left, origin: "100% 50%" },
          { k: "b", clip: right, origin: "0% 50%" },
        ].map(({ k, clip, origin }) => (
          <div key={k} data-half={k} className="absolute inset-0 flex items-center justify-center bg-noir will-change-transform" style={{ clipPath: clip, transformOrigin: origin }}>
            <Panel />
          </div>
        ))}

        {/* the bite: a bright split along the chop line and a dent where the edge went in */}
        <div data-crack className="pointer-events-none absolute w-0">
          <div data-crack-glow className="absolute -left-[7px] top-0 h-full w-[14px] bg-[linear-gradient(180deg,transparent,rgba(255,226,190,0.55)_35%,rgba(255,240,220,0.9)_50%,rgba(255,226,190,0.55)_65%,transparent)] blur-md" />
          <div data-crack-core className="absolute -left-px top-0 h-full w-[2px] bg-[linear-gradient(180deg,transparent,#fff_30%,#fff_70%,transparent)] shadow-[0_0_14px_rgba(255,236,210,0.9)]" />
        </div>
        <div data-dent className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,236,210,0.7),rgba(126,44,62,0.35)_40%,transparent_70%)] opacity-0 blur-sm" />

        {/* sparks */}
        {Array.from({ length: 34 }, (_, i) => (
          <span
            key={i}
            data-spark
            className="pointer-events-none absolute h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,#fff8e8,#ffc77a_45%,rgba(255,120,40,0))] opacity-0 shadow-[0_0_8px_rgba(255,190,110,0.9)]"
            style={{ width: 14 + ((i * 7) % 22) }}
          />
        ))}

        {/* the axe, with two motion-blur ghosts that trail it during the swing */}
        {[2, 1, 0].map((g) => (
          <div
            key={g}
            data-axe
            className={`pointer-events-none invisible absolute left-0 top-0 ${g ? "blur-[3px]" : "drop-shadow-[0_24px_30px_rgba(0,0,0,0.75)]"}`}
          >
            <Axe id={`dcf-axe-${g}`} />
          </div>
        ))}
      </div>
      <div data-flash className="pointer-events-none absolute inset-0 bg-bone opacity-0" />
    </div>
  );
}
