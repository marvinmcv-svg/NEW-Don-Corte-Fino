import type { ArtShape } from "@/lib/cuts";

/** Small deterministic RNG so every cut always gets the same marbling. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blob(r: () => number, cx: number, cy: number, rx: number, ry: number, wobble = 0.12, pts = 10) {
  const p: [number, number][] = [];
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * wobble * 2;
    p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  // Closed Catmull-Rom → cubic Bézier for a smooth organic outline
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < pts; i++) {
    const p0 = p[(i - 1 + pts) % pts], p1 = p[i], p2 = p[(i + 1) % pts], p3 = p[(i + 2) % pts];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

function veins(r: () => number, n: number, box: [number, number, number, number]) {
  const [x0, y0, w, h] = box;
  const out: { d: string; w: number; o: number }[] = [];
  for (let i = 0; i < n; i++) {
    const sx = x0 + r() * w, sy = y0 + r() * h;
    const ang = r() * Math.PI * 2;
    const len = 20 + r() * (w * 0.45);
    const ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
    const c1x = sx + (r() - 0.5) * len, c1y = sy + (r() - 0.5) * len;
    const c2x = ex + (r() - 0.5) * len, c2y = ey + (r() - 0.5) * len;
    out.push({
      d: `M${sx.toFixed(1)} ${sy.toFixed(1)} C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      w: 0.4 + r() * (r() > 0.85 ? 3.2 : 1.4),
      o: 0.35 + r() * 0.5,
    });
  }
  return out;
}

type Piece = { d: string; fat?: string; bone?: string; box: [number, number, number, number] };

function pieces(shape: ArtShape, r: () => number): Piece[] {
  switch (shape) {
    case "bone":
      return [{ d: blob(r, 175, 210, 105, 85), fat: blob(r, 175, 210, 118, 98, 0.08), bone: "M262 168 L392 74 Q404 66 410 78 Q414 90 402 98 L276 196 Z", box: [70, 120, 210, 180] }];
    case "tbone":
      return [
        { d: blob(r, 150, 200, 85, 95), fat: blob(r, 150, 200, 97, 107, 0.08), box: [65, 105, 170, 190] },
        { d: blob(r, 278, 215, 55, 70), box: [222, 145, 112, 140], bone: "M226 110 L240 110 L240 320 L226 320 Z M200 112 L268 112 L268 126 L200 126 Z" },
      ];
    case "roast":
      return [{ d: blob(r, 200, 215, 150, 75, 0.1, 12), fat: "M58 190 Q200 105 342 190 Q330 160 200 130 Q70 160 58 190 Z", box: [50, 140, 300, 150] }];
    case "strip":
      return [{ d: blob(r, 200, 200, 175, 48, 0.14, 14), box: [25, 152, 350, 96] }];
    case "ribs":
      return [0, 1, 2].map((i) => ({
        d: blob(r, 200, 120 + i * 82, 150, 30, 0.1, 12),
        bone: `M${110 + i * 18} ${108 + i * 82} h26 v26 h-26 Z M${250 - i * 12} ${108 + i * 82} h26 v26 h-26 Z`,
        box: [50, 90 + i * 82, 300, 60] as [number, number, number, number],
      }));
    case "sliced":
      return [0, 1, 2, 3, 4].map((i) => ({
        d: blob(r, 120 + i * 40, 200 + (i % 2) * 12, 70, 110, 0.12, 10),
        box: [50 + i * 40, 90, 140, 220] as [number, number, number, number],
      }));
    case "ground":
      return [{ d: blob(r, 200, 210, 130, 100, 0.18, 16), box: [70, 110, 260, 200] }];
    case "burger":
      return [
        { d: blob(r, 140, 170, 80, 80, 0.06), box: [60, 90, 160, 160] },
        { d: blob(r, 262, 240, 80, 80, 0.06), box: [182, 160, 160, 160] },
      ];
    case "jar":
      return [{ d: "M140 120 h120 v30 q20 10 20 40 v120 q0 20 -20 20 h-120 q-20 0 -20 -20 v-120 q0 -30 20 -40 Z", box: [120, 150, 160, 180] }];
    default:
      return [{ d: blob(r, 200, 205, 135, 105), fat: blob(r, 200, 205, 150, 120, 0.07), box: [65, 100, 270, 210] }];
  }
}

export default function CutArt({
  seed,
  shape,
  className = "",
  dense = 1,
}: {
  seed: string;
  shape: ArtShape;
  className?: string;
  dense?: number;
}) {
  const r = rng(seed);
  const id = `c${seed.replace(/[^a-z0-9]/gi, "")}`;
  const ps = pieces(shape, r);
  const isJar = shape === "jar";
  const isGround = shape === "ground" || shape === "burger";
  const noiseSeed = Math.floor(r() * 1000);
  const freq = shape === "sliced" ? 1.6 : shape === "strip" ? 1.3 : 1;
  // Wider bands = more fat. dense≈0.15 reads as lean commodity beef, 1.5 as high BMS.
  const band = Math.max(0, Math.min(1.6, dense));
  // Thin bands around the noise mid-value trace an organic vein network.
  const veinTable = Array.from({ length: 28 }, (_, i) => {
    const dist = Math.abs(i - 13.5);
    const width = 0.55 + band * 0.75;
    return dist <= width ? (dist <= width - 0.5 ? 0.95 : 0.55) : 0;
  }).join(" ");
  const fleckTable = Array.from({ length: 20 }, (_, i) => (i >= 19 - Math.round(band * 1.5) ? 0.85 : 0)).join(" ");

  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}m`} cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor={isJar ? "#2f5a2a" : "#b23a48"} />
          <stop offset="45%" stopColor={isJar ? "#1f3d1c" : "#8c2232"} />
          <stop offset="100%" stopColor={isJar ? "#142812" : "#4a1019"} />
        </radialGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3ead8" />
          <stop offset="100%" stopColor="#cdb994" />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7e2c3e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7e2c3e" stopOpacity="0" />
        </radialGradient>
        {/* Marbling: fractal noise thresholded into a fine network of creamy fat */}
        <filter id={`${id}v`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.03 * freq} ${0.052 * freq}`} numOctaves="4" seed={noiseSeed} result="t" />
          <feColorMatrix in="t" type="matrix" values="0 0 0 0 0.96  0 0 0 0 0.91  0 0 0 0 0.83  1 0 0 0 0" result="c" />
          <feComponentTransfer in="c" result="veins">
            <feFuncA type="table" tableValues={veinTable} />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="2" seed={noiseSeed + 7} result="t2" />
          <feColorMatrix in="t2" type="matrix" values="0 0 0 0 0.97  0 0 0 0 0.93  0 0 0 0 0.86  0 1 0 0 0" result="c2" />
          <feComponentTransfer in="c2" result="flecks">
            <feFuncA type="table" tableValues={fleckTable} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="veins" />
            <feMergeNode in="flecks" />
          </feMerge>
        </filter>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="215" rx="190" ry="160" fill={`url(#${id}g)`} />
      <ellipse cx="200" cy="340" rx="150" ry="14" fill="#000" opacity="0.45" />
      {ps.map((p, i) => (
        <g key={i}>
          {p.fat && <path d={p.fat} fill={`url(#${id}f)`} />}
          <path d={p.d} fill={`url(#${id}m)`} />
          <clipPath id={`${id}k${i}`}>
            <path d={p.d} />
          </clipPath>
          <g clipPath={`url(#${id}k${i})`}>
            {!isJar &&
              (isGround
                ? Array.from({ length: Math.round(220 * dense) }, (_, k) => (
                    <circle key={k} cx={p.box[0] + r() * p.box[2]} cy={p.box[1] + r() * p.box[3]} r={0.8 + r() * 2.2} fill="#ecdcc0" opacity={0.25 + r() * 0.5} />
                  ))
                : (
                    <>
                      <rect x={p.box[0] - 20} y={p.box[1] - 20} width={p.box[2] + 40} height={p.box[3] + 40} filter={`url(#${id}v)`} />
                      {veins(r, dense > 0.3 ? 3 : 0, p.box).map((v, k) => (
                        <path key={k} d={v.d} stroke="#efe3cb" strokeWidth={1 + v.w} strokeOpacity={0.5} fill="none" strokeLinecap="round" />
                      ))}
                    </>
                  ))}
            {isJar && (
              <>
                {Array.from({ length: 40 }, (_, k) => (
                  <circle key={k} cx={130 + r() * 140} cy={160 + r() * 170} r={1 + r() * 3} fill="#c94b2c" opacity={0.6} />
                ))}
              </>
            )}
            <rect x="0" y="0" width="400" height="400" fill={`url(#${id}l)`} />
          </g>
          {isJar && <rect x="134" y="98" width="132" height="26" rx="4" fill="#1d1d1c" stroke="#d6c5a7" strokeOpacity="0.6" />}
          {p.bone && <path d={p.bone} fill="#efe6d4" stroke="#bfae8c" strokeWidth="1.5" />}
        </g>
      ))}
    </svg>
  );
}
