import Image from "next/image";
import { useId } from "react";
import { SCENES } from "@/lib/media";

/**
 * Art-directed panels for the process steps that have no photograph yet.
 * Each one marks its zoomable layer with data-pzoom so the pinned stack can push into it.
 */

/** A striploin sealed in a glossy vacuum pouch with a printed Don Corte Fino label. */
export function VacuumVisual() {
  const id = useId();
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#2a2422,#0d0c0c_70%)]">
      <div data-pzoom className="absolute inset-0 flex items-center justify-center">
        <div className="relative aspect-[4/5] w-[62%] max-w-[420px] rotate-[-6deg]">
          {/* crimped seal edge */}
          <div className="absolute -inset-[5%] rounded-[18px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.10)_0_2px,rgba(255,255,255,0.03)_2px_5px)] shadow-[0_40px_80px_rgba(0,0,0,0.7)]" />
          <div className="absolute inset-0 overflow-hidden rounded-[12px]">
            <Image src={SCENES.vacuumCut.src} alt="" fill sizes="420px" className="scale-[1.15] object-cover saturate-[1.1]" />
            {/* film: tight wrinkles + sheen */}
            <svg className="absolute inset-0 h-full w-full mix-blend-screen" aria-hidden="true">
              <filter id={`${id}w`}>
                <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="3" seed="7" />
                <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.75" />
              </filter>
              <rect width="100%" height="100%" filter={`url(#${id}w)`} opacity="0.5" />
            </svg>
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.28)_42%,transparent_50%,transparent_70%,rgba(255,255,255,0.12)_78%,transparent_86%)]" />
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(255,255,255,0.18),inset_0_0_8px_rgba(255,255,255,0.4)]" />
          </div>
          {/* label */}
          <div className="absolute bottom-[8%] left-1/2 w-[70%] -translate-x-1/2 border border-champagne/50 bg-noir/85 px-4 py-3 text-center backdrop-blur-sm">
            <p className="font-display text-[0.65rem] tracking-[0.35em] text-champagne">DON CORTE FINO</p>
            <p className="mt-1 font-display text-sm tracking-[0.12em] text-bone">WANGUS · BIFE ANGOSTO</p>
            <div className="mx-auto mt-2 h-4 w-[80%] bg-[repeating-linear-gradient(90deg,#E8E2D6_0_1px,transparent_1px_3px,#E8E2D6_3px_5px,transparent_5px_6px)] opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Santa Cruz's ring roads (anillos) with a cold-chain route running from the shop to a door. */
export function DeliveryVisual({ label, cold }: { label: string; cold: string }) {
  const id = useId();
  const rings = [60, 110, 160, 210, 260, 310, 360];
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0f0e0e]">
      <svg data-pzoom viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}g`}>
            <stop offset="0" stopColor="#7E2C3E" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7E2C3E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="400" r="380" fill={`url(#${id}g)`} />
        {rings.map((r, i) => (
          <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="#D6C5A7" strokeOpacity={0.1 + i * 0.015} strokeWidth={i === 3 ? 2 : 1} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.round(400 + Math.cos(a) * 40)} y1={Math.round(400 + Math.sin(a) * 40)} x2={Math.round(400 + Math.cos(a) * 400)} y2={Math.round(400 + Math.sin(a) * 400)} stroke="#D6C5A7" strokeOpacity="0.06" />;
        })}
        <path id={`${id}r`} d="M400 400 L 400 290 A 110 110 0 0 1 510 400 L 610 400 A 210 210 0 0 1 548 548 L 620 620" fill="none" stroke="#D6C5A7" strokeWidth="3" strokeDasharray="8 10" className="animate-[dash_2.4s_linear_infinite]" />
        <circle cx="400" cy="400" r="9" fill="#D6C5A7" />
        <circle cx="620" cy="620" r="26" fill="none" stroke="#7E2C3E" strokeWidth="2" className="origin-center animate-ping [transform-box:fill-box]" />
        <circle cx="620" cy="620" r="10" fill="#7E2C3E" stroke="#D6C5A7" strokeWidth="2" />
        <circle r="7" fill="#E8E2D6">
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto">
            <mpath href={`#${id}r`} />
          </animateMotion>
        </circle>
      </svg>
      <div className="absolute left-6 top-6 border border-champagne/30 bg-noir/70 px-4 py-3 backdrop-blur">
        <p className="label text-[0.6rem]">{label}</p>
        <p className="mt-1 font-display text-2xl text-bone">Bs 3 / km</p>
      </div>
      <div className="absolute bottom-6 right-6 flex items-center gap-3 border border-champagne/30 bg-noir/70 px-4 py-3 backdrop-blur">
        <span className="text-2xl">❄</span>
        <p className="font-display text-xs uppercase tracking-[0.2em] text-bone">{cold}</p>
      </div>
    </div>
  );
}
