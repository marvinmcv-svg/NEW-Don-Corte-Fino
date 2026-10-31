"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, LOADED_EVENT, prefersReducedMotion } from "@/lib/gsap";

/** Logo draws in, counter runs to 100, burgundy curtain wipes up. Once per session. */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("dcf-intro") === "1";
      sessionStorage.setItem("dcf-intro", "1");
    } catch {}
    const finish = () => {
      setDone(true);
      window.dispatchEvent(new Event(LOADED_EVENT));
      (window as unknown as { __dcfLoaded?: boolean }).__dcfLoaded = true;
    };
    if (seen || prefersReducedMotion() || !root.current) {
      finish();
      return;
    }

    const el = root.current;
    const counter = { v: 0 };
    const num = el.querySelector<HTMLElement>("[data-count]")!;
    const tl = gsap.timeline({ onComplete: finish });
    tl.set(el, { autoAlpha: 1 })
      .fromTo(el.querySelectorAll("[data-draw]"), { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.12 })
      .to(counter, { v: 100, duration: 1.8, ease: "power3.inOut", onUpdate: () => { num.textContent = String(Math.round(counter.v)).padStart(3, "0"); } }, 0)
      .from(el.querySelectorAll("[data-letter]"), { yPercent: 120, duration: 0.9, stagger: 0.035 }, 0.5)
      .to(el.querySelectorAll("[data-fill]"), { fillOpacity: 1, duration: 0.6 }, 1.3)
      .to(el.querySelector("[data-inner]"), { yPercent: -30, autoAlpha: 0, duration: 0.8, ease: "power3.in" }, 2.1)
      .to(el.querySelector("[data-curtain]"), { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, 2.3)
      .to(el, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, 2.45);
    return () => {
      tl.kill();
    };
  }, []);

  if (done) return null;
  const word = "DON CORTE FINO";
  return (
    <div ref={root} className="invisible fixed inset-0 z-[200] flex items-center justify-center bg-noir" aria-hidden="true">
      <div data-curtain className="absolute inset-0 translate-y-full bg-burgundy" />
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
    </div>
  );
}
