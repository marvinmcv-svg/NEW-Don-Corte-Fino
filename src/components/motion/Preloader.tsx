"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, LOADED_EVENT, prefersReducedMotion } from "@/lib/gsap";

/**
 * Intro on every full page load: the logo draws in and the counter runs to 100, then a chef's knife
 * slashes across the screen and the two halves fall apart along the cut to reveal the page.
 * Client-side navigation keeps the layout mounted, so it only plays on a real load / refresh.
 */

/** The cut runs from (0, CUT_L) to (100%, CUT_R) of the viewport. */
const CUT_L = 0.36;
const CUT_R = 0.64;

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
              {c === " " ? "\u00a0" : c}
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

/** Chef's knife, drawn pointing right (+x) so it can travel along the cut. */
function Knife() {
  return (
    <svg viewBox="0 0 420 70" className="h-[60px] w-[360px] md:h-[90px] md:w-[540px]" aria-hidden="true">
      <defs>
        <linearGradient id="dcf-blade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f1ea" />
          <stop offset="0.45" stopColor="#b9b6ae" />
          <stop offset="0.8" stopColor="#7d7a74" />
          <stop offset="1" stopColor="#fffdf6" />
        </linearGradient>
        <linearGradient id="dcf-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a24" />
          <stop offset="1" stopColor="#120c0a" />
        </linearGradient>
        <linearGradient id="dcf-glint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* handle */}
      <path d="M4 27 Q 2 35 4 43 L 128 44 L 128 26 Z" fill="url(#dcf-handle)" />
      <rect x="126" y="22" width="12" height="26" rx="2" fill="#cfcac0" />
      {[30, 64, 98].map((x) => (
        <circle key={x} cx={x} cy="35" r="3" fill="#cfcac0" />
      ))}
      {/* blade: straight spine on top, curved edge sweeping up to the tip */}
      <path d="M138 20 L 380 22 Q 410 24 418 30 Q 388 52 300 56 L 138 56 Z" fill="url(#dcf-blade)" />
      <path d="M138 55 L 300 55.5 Q 388 51 418 30" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.2" />
      <rect data-glint x="140" y="22" width="60" height="32" fill="url(#dcf-glint)" opacity="0.8" />
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
    // Geometry of the slash, in px
    const x0 = 0, y0 = H * CUT_L;
    const dx = W, dy = H * (CUT_R - CUT_L);
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    // unit normal pointing "up" out of the cut, for pulling the halves apart
    const nx = Math.sin(ang), ny = -Math.cos(ang);

    const slash = el.querySelector<HTMLElement>("[data-slash]")!;
    gsap.set(slash, { x: x0, y: y0, width: len, rotation: (ang * 180) / Math.PI, transformOrigin: "0 50%" });

    const counter = { v: 0 };
    const nums = el.querySelectorAll<HTMLElement>("[data-count]");
    const tl = gsap.timeline({ onComplete: finish });
    tl
      .fromTo(el.querySelectorAll("[data-draw]"), { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.12 })
      .to(counter, { v: 100, duration: 1.8, ease: "power3.inOut", onUpdate: () => nums.forEach((n) => (n.textContent = String(Math.round(counter.v)).padStart(3, "0"))) }, 0)
      .from(el.querySelectorAll("[data-letter]"), { yPercent: 120, duration: 0.9, stagger: 0.035 }, 0.5)
      .to(el.querySelectorAll("[data-fill]"), { fillOpacity: 1, duration: 0.6 }, 1.3)

      // The knife: a glint, then one fast stroke across the screen
      .addLabel("cut", 2.05)
      .fromTo("[data-knife]", { x: -600, autoAlpha: 1 }, { x: len + 60, duration: 0.5, ease: "power3.in" }, "cut")
      .fromTo("[data-glint]", { attr: { x: 140 } }, { attr: { x: 360 }, duration: 0.35, ease: "none" }, "cut")
      .fromTo("[data-slash-line]", { scaleX: 0 }, { scaleX: 1, duration: 0.42, ease: "power3.in" }, "cut+=0.06")
      .fromTo("[data-slash-glow]", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.42, ease: "power3.in" }, "cut+=0.06")
      .fromTo(el.querySelector("[data-flash]"), { opacity: 0 }, { opacity: 0.35, duration: 0.06, yoyo: true, repeat: 1, ease: "none" }, "cut+=0.5")
      .to("[data-shake]", { x: "+=6", y: "-=4", duration: 0.05, yoyo: true, repeat: 3, ease: "none" }, "cut+=0.48")

      // Beat, then the two halves slide apart along the cut
      .addLabel("split", "cut+=0.75")
      .to("[data-slash]", { autoAlpha: 0, duration: 0.25 }, "split")
      .to("[data-half='a']", { x: nx * H * 0.9 - Math.cos(ang) * 80, y: ny * H * 0.9 - Math.sin(ang) * 80, rotation: -3, duration: 1.15, ease: "expo.inOut" }, "split")
      .to("[data-half='b']", { x: -nx * H * 0.9 + Math.cos(ang) * 80, y: -ny * H * 0.9 + Math.sin(ang) * 80, rotation: 3, duration: 1.15, ease: "expo.inOut" }, "split")
      .to("[data-seam]", { opacity: 0, duration: 0.9 }, "split+=0.2");
    return () => {
      tl.kill();
    };
  }, []);

  if (done) return null;
  const top = `polygon(0 0, 100% 0, 100% ${CUT_R * 100}%, 0 ${CUT_L * 100}%)`;
  const bottom = `polygon(0 ${CUT_L * 100}%, 100% ${CUT_R * 100}%, 100% 100%, 0 100%)`;
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
          { k: "a", clip: top },
          { k: "b", clip: bottom },
        ].map(({ k, clip }) => (
          <div key={k} data-half={k} className="absolute inset-0 flex items-center justify-center bg-noir will-change-transform" style={{ clipPath: clip }}>
            <Panel />
          </div>
        ))}
        {/* the slash: glowing line + the knife that draws it */}
        <div data-slash className="pointer-events-none absolute left-0 top-0 h-0">
          <div data-slash-glow className="absolute -top-[6px] left-0 h-3 w-full origin-left bg-[linear-gradient(90deg,transparent,rgba(214,197,167,0.6)_20%,rgba(255,240,220,0.9)_80%,#fff)] blur-md" />
          <div data-slash-line className="absolute -top-px left-0 h-[2px] w-full origin-left bg-[linear-gradient(90deg,rgba(214,197,167,0.2),#fff_85%)] shadow-[0_0_14px_rgba(255,236,210,0.9)]" />
          <div data-knife className="invisible absolute left-0 top-0 -translate-y-[78%] drop-shadow-[0_8px_18px_rgba(0,0,0,0.7)]">
            <Knife />
          </div>
        </div>
      </div>
      <div data-flash className="pointer-events-none absolute inset-0 bg-bone opacity-0" />
    </div>
  );
}
