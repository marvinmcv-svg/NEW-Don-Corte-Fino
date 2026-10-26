"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/** Small ring that trails the pointer and grows with a label over [data-cursor] elements. Desktop only. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const r = ring.current!, d = dot.current!, l = label.current!;
    gsap.set([r, d], { xPercent: -50, yPercent: -50, autoAlpha: 1 });
    const rx = gsap.quickTo(r, "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.5, ease: "power3" });
    const dx = gsap.quickTo(d, "x", { duration: 0.1 });
    const dy = gsap.quickTo(d, "y", { duration: 0.1 });
    const move = (e: PointerEvent) => {
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button");
      const text = t?.dataset.cursor ?? "";
      const big = !!t?.dataset.cursor;
      gsap.to(r, { width: big ? 96 : t ? 54 : 34, height: big ? 96 : t ? 54 : 34, backgroundColor: big ? "rgba(97,33,47,0.85)" : "rgba(0,0,0,0)", duration: 0.35 });
      l.textContent = text;
    };
    window.addEventListener("pointermove", move);
    document.documentElement.classList.add("has-cursor");
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} className="pointer-events-none invisible fixed left-0 top-0 z-[150] flex h-[34px] w-[34px] items-center justify-center rounded-full border border-champagne/60 mix-blend-difference md:flex" aria-hidden="true">
        <span ref={label} className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-bone" />
      </div>
      <div ref={dot} className="pointer-events-none invisible fixed left-0 top-0 z-[150] h-1.5 w-1.5 rounded-full bg-champagne" aria-hidden="true" />
    </>
  );
}
