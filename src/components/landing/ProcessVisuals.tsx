"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { SCENES } from "@/lib/media";

/**
 * Art-directed panels for the process steps.
 * Each one marks its zoomable layer with data-pzoom so the pinned stack can push into it.
 */

/** Real cuts from the counter, each sealed in its own labelled vacuum pouch. */
export function VacuumVisual({ alt }: { alt: string }) {
  return (
    <>
      <Image data-pzoom src={SCENES.vacuum.src} alt={alt} fill sizes="(min-width:1024px) 50vw, 50vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-noir/40 to-transparent" />
    </>
  );
}

/* ───────── Delivery: a moto runs the cold chain across Santa Cruz's ring roads ───────── */

const C = { x: 400, y: 430 };
const pol = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [C.x + Math.cos(a) * r, C.y + Math.sin(a) * r] as const;
};
const f = (n: number) => Math.round(n * 10) / 10;
const A = pol(92, 205);
const A2 = pol(205, 205);
const B1 = pol(205, 322);
const B = pol(318, 322);
/** Out of the shop's block, round the 3er anillo, then up the radial avenue to the door. */
const ROUTE = `M${f(A[0])} ${f(A[1])} L ${f(A2[0])} ${f(A2[1])} A 205 205 0 0 1 ${f(B1[0])} ${f(B1[1])} L ${f(B[0])} ${f(B[1])}`;

/** Side-view delivery moto with a branded cooler box on the back. Faces right. */
function Moto() {
  return (
    <g>
      {/* shadow */}
      <ellipse cx="0" cy="17" rx="26" ry="3.5" fill="#000" opacity="0.5" />
      {/* wheels */}
      {[-17, 17].map((x) => (
        <g key={x}>
          <circle cx={x} cy="9" r="8" fill="#0c0b0b" stroke="#3a3533" strokeWidth="2" />
          <circle cx={x} cy="9" r="2.4" fill="#8a817a" />
          <g data-spoke style={{ transformOrigin: `${x}px 9px` }}>
            <path d={`M${x - 5.5} 9 H ${x + 5.5} M ${x} 3.5 V 14.5`} stroke="#5a524d" strokeWidth="1" />
          </g>
        </g>
      ))}
      {/* frame + body */}
      <path d="M-17 9 L -6 -1 L 9 -1 L 17 9" fill="none" stroke="#3a3533" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-12 -2 Q -6 -9 6 -8 L 14 -6 L 12 2 L -8 3 Z" fill="#7E2C3E" />
      <path d="M10 -8 L 18 -16" stroke="#cfc6b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 -17 L 21 -15" stroke="#cfc6b8" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="19.5" cy="-8" r="2.4" fill="#ffe7b0" />
      {/* cooler box */}
      <rect x="-27" y="-28" width="20" height="20" rx="2.5" fill="#EAE3CF" />
      <rect x="-27" y="-28" width="20" height="5" rx="2" fill="#D6C5A7" />
      <text x="-17" y="-12" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#61212F" fontFamily="serif">DCF</text>
      {/* rider */}
      <path d="M-6 -6 L 2 -6 L 8 3" stroke="#1b1a19" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M-5 -6 Q -6 -18 0 -22 L 8 -14 L 14 -15" stroke="#2b2826" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="1" cy="-28" r="6" fill="#61212F" />
      <path d="M-4 -28 Q 1 -35 7 -28 Z" fill="#7E2C3E" />
      <rect x="2" y="-29.5" width="5.5" height="3" rx="1.2" fill="#1a1c1f" opacity="0.85" />
    </g>
  );
}

export function DeliveryVisual({ label, cold, shop, door, onTheWay, delivered }: { label: string; cold: string; shop: string; door: string; onTheWay: string; delivered: string }) {
  const id = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const path = el.querySelector<SVGPathElement>("[data-route]")!;
    const done = el.querySelectorAll<SVGPathElement>("[data-route-done]");
    const moto = el.querySelector<SVGGElement>("[data-moto]")!;
    const flip = el.querySelector<SVGGElement>("[data-flip]")!;
    const eta = el.querySelector<HTMLElement>("[data-eta]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    const status = el.querySelector<HTMLElement>("[data-status]")!;
    const L = path.getTotalLength();
    done.forEach((d) => (d.style.strokeDasharray = `${L}`));

    const place = (p: number) => {
      const d = L * p;
      const pt = path.getPointAtLength(d);
      const ahead = path.getPointAtLength(Math.min(L, d + 2));
      const dx = ahead.x - pt.x;
      const dy = ahead.y - pt.y;
      // keep the rider upright: only lean a little into the direction of travel
      const lean = gsap.utils.clamp(-18, 18, (Math.atan2(dy, Math.abs(dx) + 0.001) * 180) / Math.PI);
      moto.setAttribute("transform", `translate(${pt.x} ${pt.y - 14})`);
      flip.setAttribute("transform", `scale(${dx < -0.05 ? -1 : 1} 1) rotate(${dx < -0.05 ? -lean : lean})`);
      done.forEach((dd) => (dd.style.strokeDashoffset = `${L * (1 - p)}`));
      bar.style.transform = `scaleX(${p})`;
      eta.textContent = `${Math.max(1, Math.round(18 * (1 - p)))} min`;
    };

    if (prefersReducedMotion()) {
      place(0.6);
      return;
    }
    const s = { p: 0 };
    const spokes = el.querySelectorAll("[data-spoke]");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    tl.call(() => void (status.textContent = onTheWay))
      .to(s, { p: 1, duration: 7, ease: "power1.inOut", onUpdate: () => place(s.p) })
      .to(spokes, { rotation: 360 * 14, duration: 7, ease: "power1.inOut" }, 0)
      .call(() => void (status.textContent = delivered))
      .fromTo("[data-arrive]", { scale: 0.4, opacity: 1 }, { scale: 2.6, opacity: 0, duration: 1.1, ease: "power2.out", transformOrigin: "50% 50%" })
      .to({}, { duration: 1.4 })
      .set(spokes, { rotation: 0 });
    place(0);

    // Only run while on screen
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
    io.observe(el);
    return () => {
      io.disconnect();
      tl.kill();
    };
  }, [onTheWay, delivered]);

  const rings = [70, 120, 165, 205, 250, 290, 330];
  return (
    <div ref={root} className="absolute inset-0 overflow-hidden bg-[#0f0e0e]">
      <svg data-pzoom viewBox="40 60 720 720" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}g`}>
            <stop offset="0" stopColor="#7E2C3E" stopOpacity="0.45" />
            <stop offset="1" stopColor="#7E2C3E" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${id}blocks`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
            <rect width="22" height="22" fill="none" />
            <rect x="2" y="2" width="18" height="18" fill="#D6C5A7" fillOpacity="0.035" />
          </pattern>
          <filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <rect x="40" y="60" width="720" height="720" fill={`url(#${id}blocks)`} />
        <circle cx={C.x} cy={C.y} r="360" fill={`url(#${id}g)`} />
        {/* the Piraí river along the west edge */}
        <path d="M60 80 C 120 220, 70 360, 120 500 S 90 700, 140 790" fill="none" stroke="#3b5566" strokeOpacity="0.35" strokeWidth="14" strokeLinecap="round" />
        {/* anillos + radial avenues */}
        {rings.map((r, i) => (
          <circle key={r} cx={C.x} cy={C.y} r={r} fill="none" stroke="#D6C5A7" strokeOpacity={i === 3 ? 0.28 : 0.1} strokeWidth={i === 3 ? 3 : 1.4} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const [x1, y1] = pol(40, i * 30 + 25);
          const [x2, y2] = pol(380, i * 30 + 25);
          return <line key={i} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} stroke="#D6C5A7" strokeOpacity="0.08" strokeWidth="1.4" />;
        })}
        <text x={C.x} y={C.y + 198} textAnchor="middle" className="fill-champagne/40 text-[11px] uppercase tracking-[0.3em]">3er anillo</text>
        <circle cx={C.x} cy={C.y} r="5" fill="#D6C5A7" fillOpacity="0.4" />
        <text x={C.x} y={C.y + 20} textAnchor="middle" className="fill-ash text-[10px] uppercase tracking-[0.25em]">Plaza 24 de Septiembre</text>

        {/* route: dashed full path, then the travelled part glowing on top */}
        <path data-route d={ROUTE} fill="none" stroke="#D6C5A7" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
        <path d={ROUTE} data-route-done fill="none" stroke="#D6C5A7" strokeWidth="9" strokeOpacity="0.35" filter={`url(#${id}glow)`} style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }} />
        <path d={ROUTE} data-route-done fill="none" stroke="#EAE3CF" strokeWidth="3.5" strokeLinecap="round" style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }} />

        {/* A: the shop */}
        <g transform={`translate(${f(A[0])} ${f(A[1])})`}>
          <circle r="16" fill="#141413" stroke="#D6C5A7" strokeWidth="2" />
          <text y="4.5" textAnchor="middle" fontSize="13" className="fill-champagne font-display">A</text>
          <text y="36" textAnchor="middle" className="fill-bone text-[14px] tracking-[0.12em]">{shop}</text>
        </g>
        {/* B: the customer's door */}
        <g transform={`translate(${f(B[0])} ${f(B[1])})`}>
          <circle data-arrive r="18" fill="none" stroke="#D6C5A7" strokeWidth="2" opacity="0" />
          <circle r="26" fill="none" stroke="#7E2C3E" strokeWidth="2" className="origin-center animate-ping [transform-box:fill-box]" />
          <circle r="16" fill="#7E2C3E" stroke="#EAE3CF" strokeWidth="2" />
          <text y="4.5" textAnchor="middle" fontSize="13" className="fill-bone font-display">B</text>
          <text y="-28" textAnchor="middle" className="fill-bone text-[14px] tracking-[0.12em]">{door}</text>
        </g>

        <g data-moto transform={`translate(${f(A[0])} ${f(A[1]) - 14})`}>
          <g data-flip>
            <g transform="scale(1.35)">
              <Moto />
            </g>
          </g>
        </g>
      </svg>

      {/* overlays, kept inside the frame at every size */}
      <div className="absolute left-4 top-4 border border-champagne/30 bg-noir/75 px-4 py-3 backdrop-blur md:left-6 md:top-6">
        <p className="label text-[0.6rem]">{label}</p>
        <p className="mt-1 font-display text-xl text-bone md:text-2xl">Bs 3 / km</p>
      </div>
      <div className="absolute right-4 top-4 flex items-center gap-2 border border-champagne/30 bg-noir/75 px-3 py-2 backdrop-blur md:right-6 md:top-6">
        <span className="text-lg text-champagne">❄</span>
        <p className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-bone">{cold} · 2 °C</p>
      </div>
      <div className="absolute inset-x-4 bottom-4 border border-champagne/30 bg-noir/80 px-4 py-3 backdrop-blur md:inset-x-6 md:bottom-6">
        <div className="flex items-baseline justify-between gap-3">
          <p data-status className="font-display text-sm uppercase tracking-[0.18em] text-bone">{onTheWay}</p>
          <p className="text-xs text-champagne">
            ETA <span data-eta className="font-display text-base tabular-nums text-bone">18 min</span>
          </p>
        </div>
        <div className="mt-2 h-[3px] bg-champagne/15">
          <div data-bar className="h-full origin-left scale-x-0 bg-gradient-to-r from-wine to-champagne" />
        </div>
      </div>
    </div>
  );
}
