/**
 * Procedural Wangus steer: a signed-distance sculpt (smooth-unioned ellipsoids and tapered capsules)
 * meshed with naive surface nets, then relaxed onto the surface. Polled, like Angus and most Wangus.
 * Object space: head toward −x, ground at y = 0, +z faces the default camera.
 */

import { PRIMAL_ORDER, type PrimalKey } from "@/lib/cuts";

type V3 = [number, number, number];

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

/** Smooth subtraction: carve b out of a. */
const ssub = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(-b - a), 0) / k;
  return Math.max(a, -b) + h * h * k * 0.25;
};

function ellipsoid(x: number, y: number, z: number, c: V3, r: V3) {
  const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
  const k0 = Math.hypot(px, py, pz);
  const k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}

function taper(x: number, y: number, z: number, a: V3, b: V3, ra: number, rb: number) {
  const pax = x - a[0], pay = y - a[1], paz = z - a[2];
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
}

/** Signed distance to the steer. Mirrored in z, so limbs and ears are written for one side. */
export function cowSDF(x: number, y: number, zz: number) {
  const z = Math.abs(zz);
  // barrel: deep, blocky beef frame
  let d = ellipsoid(x, y, z, [0.05, 1.17, 0], [1.05, 0.47, 0.44]);
  d = smin(d, ellipsoid(x, y, z, [-0.62, 1.19, 0], [0.54, 0.52, 0.45]), 0.22);
  d = smin(d, ellipsoid(x, y, z, [-0.5, 1.5, 0], [0.44, 0.16, 0.3]), 0.2);
  d = smin(d, ellipsoid(x, y, z, [0.8, 1.24, 0], [0.54, 0.49, 0.46]), 0.22);
  d = smin(d, ellipsoid(x, y, z, [0.86, 1.55, 0.2], [0.14, 0.1, 0.12]), 0.14);
  d = smin(d, ellipsoid(x, y, z, [0.0, 0.93, 0], [0.8, 0.36, 0.42]), 0.25);
  d = smin(d, ellipsoid(x, y, z, [-0.98, 0.95, 0], [0.3, 0.33, 0.25]), 0.18);
  // neck with dewlap
  d = smin(d, taper(x, y, z, [-0.86, 1.28, 0], [-1.3, 1.42, 0], 0.4, 0.21), 0.16);
  d = smin(d, ellipsoid(x, y, z, [-1.12, 1.04, 0], [0.2, 0.18, 0.1]), 0.16);
  // head: flat, broad forehead; deep cheek and jaw; a long nose bridge narrowing to a wide, flat muzzle
  d = smin(d, ellipsoid(x, y, z, [-1.4, 1.56, 0], [0.13, 0.11, 0.17]), 0.09); // poll / forehead
  d = smin(d, ellipsoid(x, y, z, [-1.47, 1.3, 0], [0.13, 0.15, 0.125]), 0.09); // cheeks and jaw
  d = smin(d, taper(x, y, z, [-1.46, 1.48, 0], [-1.74, 1.06, 0], 0.13, 0.085), 0.08); // face
  d = smin(d, ellipsoid(x, y, z, [-1.79, 0.99, 0], [0.09, 0.095, 0.125]), 0.06); // muzzle
  d = smin(d, ellipsoid(x, y, z, [-1.68, 0.965, 0], [0.15, 0.06, 0.085]), 0.1); // lower jaw and chin
  // ears: broad leaves held out level from behind the eyes, cupped on the inside
  d = smin(d, ellipsoid(x, y, z, [-1.38, 1.47, 0.32], [0.07, 0.035, 0.12]), 0.05);
  d = smin(d, ellipsoid(x, y, z, [-1.39, 1.445, 0.45], [0.06, 0.03, 0.08]), 0.05);
  d = ssub(d, ellipsoid(x, y, z, [-1.43, 1.46, 0.4], [0.03, 0.02, 0.11]), 0.02);
  // brow ridge and eye sockets (the eyeballs themselves are separate meshes)
  d = smin(d, ellipsoid(x, y, z, [-1.47, 1.475, 0.15], [0.07, 0.03, 0.06]), 0.05);
  d = ssub(d, ellipsoid(x, y, z, [-1.505, 1.41, 0.17], [0.038, 0.034, 0.028]), 0.02);
  // nostrils and the cleft of the upper lip
  d = ssub(d, ellipsoid(x, y, z, [-1.857, 1.0, 0.058], [0.024, 0.018, 0.016]), 0.015);
  d = ssub(d, ellipsoid(x, y, z, [-1.85, 0.915, 0], [0.04, 0.008, 0.11]), 0.012);
  // poll tuft between the ears
  d = smin(d, ellipsoid(x, y, z, [-1.38, 1.66, 0], [0.08, 0.035, 0.11]), 0.06);
  // front legs: forearm, knee, cannon, fetlock, hoof
  d = smin(d, taper(x, y, z, [-0.66, 0.95, 0.21], [-0.7, 0.42, 0.21], 0.16, 0.085), 0.12);
  d = smin(d, ellipsoid(x, y, z, [-0.7, 0.42, 0.21], [0.075, 0.07, 0.075]), 0.04);
  d = smin(d, taper(x, y, z, [-0.7, 0.42, 0.21], [-0.72, 0.12, 0.21], 0.06, 0.055), 0.04);
  d = smin(d, ellipsoid(x, y, z, [-0.725, 0.12, 0.21], [0.06, 0.05, 0.06]), 0.03);
  d = smin(d, taper(x, y, z, [-0.735, 0.1, 0.21], [-0.77, 0.01, 0.21], 0.065, 0.085), 0.025);
  // hind legs: thigh, gaskin back to the hock, cannon down to the hoof
  d = smin(d, ellipsoid(x, y, z, [0.92, 0.96, 0.22], [0.34, 0.42, 0.21]), 0.16);
  d = smin(d, taper(x, y, z, [0.94, 0.8, 0.22], [1.03, 0.45, 0.22], 0.14, 0.075), 0.08);
  d = smin(d, ellipsoid(x, y, z, [1.04, 0.45, 0.22], [0.07, 0.065, 0.065]), 0.04); // hock
  d = smin(d, taper(x, y, z, [1.02, 0.44, 0.22], [0.97, 0.12, 0.22], 0.058, 0.055), 0.04);
  d = smin(d, ellipsoid(x, y, z, [0.965, 0.12, 0.22], [0.06, 0.05, 0.06]), 0.03);
  d = smin(d, taper(x, y, z, [0.96, 0.1, 0.22], [0.93, 0.01, 0.22], 0.065, 0.085), 0.025);
  // hip bones (hooks) and pin bones give the rump its square, bony corners
  d = smin(d, ellipsoid(x, y, z, [0.66, 1.6, 0.27], [0.1, 0.07, 0.08]), 0.1);
  d = smin(d, ellipsoid(x, y, z, [1.22, 1.55, 0.12], [0.08, 0.06, 0.06]), 0.08);
  // tail
  d = smin(d, taper(x, y, zz, [1.27, 1.5, 0], [1.37, 0.72, 0], 0.05, 0.028), 0.06);
  d = smin(d, ellipsoid(x, y, zz, [1.38, 0.64, 0], [0.06, 0.12, 0.06]), 0.04);
  return d;
}

/** First point on the +z side where a ray from +z along −z meets the hide, or null. */
export function surfaceZ(x: number, y: number) {
  let z = 0.8;
  for (let i = 0; i < 80 && z > -0.1; i++) {
    const d = cowSDF(x, y, z);
    if (d < 0.0008) return z;
    z -= Math.max(d, 0.002);
  }
  return null;
}

/** Eyeball centre (+z side), sat a little inside the socket. */
export const EYE: V3 = [-1.505, 1.41, 0.148];
export const EYE_R = 0.034;
/** The neck hinge the head turns around, and how far behind it the bend fades out. */
export const NECK_PIVOT: V3 = [-1.08, 1.36, 0];

/* ───────── cut zones, shared with the shader (keep in sync with ZONE_GLSL) ───────── */

export const ZONE_KEYS: PrimalKey[] = PRIMAL_ORDER;

type Rect = [number, number, number, number]; // x0, x1, y0, y1
const TOP = 9;

export function zoneRect(x: number, y: number): { key: PrimalKey; rect: Rect } | null {
  if (x < -1.05 || x > 1.3 || y < 0.7) return null;
  if (x < -0.4) return y >= 1.08 ? { key: "chuck", rect: [-1.05, -0.4, 1.08, TOP] } : { key: "brisket", rect: [-1.05, -0.4, 0.7, 1.08] };
  if (x < 0.12) return y >= 1.08 ? { key: "rib", rect: [-0.4, 0.12, 1.08, TOP] } : { key: "plate", rect: [-0.4, 0.12, 0.7, 1.08] };
  if (x < 0.58) {
    if (y >= 1.32) return { key: "loin", rect: [0.12, 0.58, 1.32, TOP] };
    if (y >= 1.08) return { key: "tenderloin", rect: [0.12, 0.58, 1.08, 1.32] };
    return { key: "flank", rect: [0.12, 0.58, 0.7, 1.08] };
  }
  if (y >= 1.12) return { key: "rump", rect: [0.58, 1.3, 1.12, TOP] };
  return null;
}

/** Where the camera looks when a zone is chosen (on the +z flank). */
export const ZONE_FOCUS: Record<PrimalKey, V3> = {
  chuck: [-0.72, 1.4, 0.42],
  rib: [-0.14, 1.4, 0.44],
  loin: [0.35, 1.5, 0.4],
  tenderloin: [0.35, 1.2, 0.44],
  rump: [0.92, 1.42, 0.42],
  brisket: [-0.8, 0.9, 0.3],
  plate: [-0.14, 0.86, 0.4],
  flank: [0.35, 0.86, 0.38],
};

export const ZONE_GLSL = /* glsl */ `
float zoneOf(vec3 p, out vec4 r) {
  r = vec4(0.0);
  if (p.x < -1.05 || p.x > 1.3 || p.y < 0.7) return 0.0;
  if (p.x < -0.4) { if (p.y >= 1.08) { r = vec4(-1.05, -0.4, 1.08, 9.0); return 1.0; } r = vec4(-1.05, -0.4, 0.7, 1.08); return 6.0; }
  if (p.x < 0.12) { if (p.y >= 1.08) { r = vec4(-0.4, 0.12, 1.08, 9.0); return 2.0; } r = vec4(-0.4, 0.12, 0.7, 1.08); return 7.0; }
  if (p.x < 0.58) {
    if (p.y >= 1.32) { r = vec4(0.12, 0.58, 1.32, 9.0); return 3.0; }
    if (p.y >= 1.08) { r = vec4(0.12, 0.58, 1.08, 1.32); return 4.0; }
    r = vec4(0.12, 0.58, 0.7, 1.08); return 8.0;
  }
  if (p.y >= 1.12) { r = vec4(0.58, 1.3, 1.12, 9.0); return 5.0; }
  return 0.0;
}`;

/** 1-based shader id for a zone key (0 = hide / no zone). */
export const zoneId = (k: PrimalKey | null) => (k ? ZONE_KEYS.indexOf(k) + 1 : 0);

/* ───────── meshing ───────── */

export type CowMesh = { positions: Float32Array; normals: Float32Array; indices: Uint32Array };

const MIN: V3 = [-1.98, -0.03, -0.62];
const MAX: V3 = [1.58, 1.86, 0.62];

function gradient(x: number, y: number, z: number): V3 {
  const e = 0.004;
  const gx = cowSDF(x + e, y, z) - cowSDF(x - e, y, z);
  const gy = cowSDF(x, y + e, z) - cowSDF(x, y - e, z);
  const gz = cowSDF(x, y, z + e) - cowSDF(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
}

/** Naive surface nets (one vertex per sign-changing cell, quads across sign-changing edges). */
export function buildCow(cell = 0.02): CowMesh {
  const nx = Math.ceil((MAX[0] - MIN[0]) / cell) + 1;
  const ny = Math.ceil((MAX[1] - MIN[1]) / cell) + 1;
  const nz = Math.ceil((MAX[2] - MIN[2]) / cell) + 1;
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const f = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) f[at(i, j, k)] = cowSDF(MIN[0] + i * cell, MIN[1] + j * cell, MIN[2] + k * cell);

  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const cellAt = (i: number, j: number, k: number) => i + cx * (j + cy * k);
  const vert = new Int32Array(cx * cy * cz).fill(-1);
  const pos: number[] = [];
  const corners: V3[] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges: [number, number][] = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);

  for (let k = 0; k < cz; k++)
    for (let j = 0; j < cy; j++)
      for (let i = 0; i < cx; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          v[c] = f[at(i + corners[c][0], j + corners[c][1], k + corners[c][2])];
          if (v[c] < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of edges) {
          if (v[a] < 0 === v[b] < 0) continue;
          const t = v[a] / (v[a] - v[b]);
          sx += corners[a][0] + (corners[b][0] - corners[a][0]) * t;
          sy += corners[a][1] + (corners[b][1] - corners[a][1]) * t;
          sz += corners[a][2] + (corners[b][2] - corners[a][2]) * t;
          n++;
        }
        vert[cellAt(i, j, k)] = pos.length / 3;
        pos.push(MIN[0] + (i + sx / n) * cell, MIN[1] + (j + sy / n) * cell, MIN[2] + (k + sz / n) * cell);
      }

  const idx: number[] = [];
  const dims = [nx, ny, nz];
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const p = [i, j, k];
        const inside = f[at(i, j, k)] < 0;
        for (let d = 0; d < 3; d++) {
          const u = (d + 1) % 3, w = (d + 2) % 3;
          if (p[d] >= dims[d] - 1 || p[u] < 1 || p[w] < 1 || p[u] >= dims[u] - 1 || p[w] >= dims[w] - 1) continue;
          const q = [...p];
          q[d]++;
          if (inside === f[at(q[0], q[1], q[2])] < 0) continue;
          const c = (du: number, dw: number) => {
            const r = [...p];
            r[u] -= du;
            r[w] -= dw;
            return vert[cellAt(r[0], r[1], r[2])];
          };
          const a = c(0, 0), b = c(1, 0), e = c(1, 1), g = c(0, 1);
          if (a < 0 || b < 0 || e < 0 || g < 0) continue;
          if (inside) idx.push(a, b, e, a, e, g);
          else idx.push(a, e, b, a, g, e);
        }
      }

  // Relax each vertex onto the true surface, then take normals from the field gradient.
  const positions = new Float32Array(pos);
  const normals = new Float32Array(pos.length);
  for (let o = 0; o < positions.length; o += 3) {
    let x = positions[o], y = positions[o + 1], z = positions[o + 2];
    for (let it = 0; it < 2; it++) {
      const dd = cowSDF(x, y, z);
      const g = gradient(x, y, z);
      x -= g[0] * dd;
      y -= g[1] * dd;
      z -= g[2] * dd;
    }
    const g = gradient(x, y, z);
    positions.set([x, y, z], o);
    normals.set(g, o);
  }
  return { positions, normals, indices: new Uint32Array(idx) };
}

/* ───────── individual cuts: where each one sits on the side of the animal ───────── */

/** kind 1 = ellipse, 2 = rounded box, 3 = bone (a rounded box drawn as bone). (cx, cy, rx|hx, ry|hy), rotation in radians. */
export type CutShape = { kind: 1 | 2 | 3; c: [number, number]; r: [number, number]; rot?: number };

export const CUT_SHAPES: Record<string, CutShape[]> = {
  // Rib
  ribeye: [{ kind: 1, c: [-0.14, 1.5], r: [0.25, 0.12] }],
  tomahawk: [
    { kind: 1, c: [-0.14, 1.5], r: [0.22, 0.11] },
    { kind: 3, c: [-0.12, 1.2], r: [0.035, 0.24], rot: 0.12 },
  ],
  "bone-in-ribeye": [
    { kind: 1, c: [-0.14, 1.47], r: [0.24, 0.14] },
    { kind: 3, c: [-0.12, 1.27], r: [0.035, 0.1], rot: 0.12 },
  ],
  // Short loin / tenderloin
  striploin: [{ kind: 1, c: [0.36, 1.53], r: [0.22, 0.1] }],
  "t-bone": [
    { kind: 1, c: [0.35, 1.5], r: [0.12, 0.1] },
    { kind: 3, c: [0.35, 1.37], r: [0.13, 0.024] },
    { kind: 1, c: [0.35, 1.24], r: [0.09, 0.08] },
  ],
  tenderloin: [{ kind: 1, c: [0.42, 1.21], r: [0.34, 0.065], rot: -0.06 }],
  // Rump
  picanha: [{ kind: 1, c: [0.95, 1.62], r: [0.3, 0.085], rot: -0.12 }],
  "tri-tip": [{ kind: 1, c: [0.7, 1.15], r: [0.17, 0.07], rot: -0.45 }],
  // Chuck
  denver: [{ kind: 1, c: [-0.72, 1.3], r: [0.17, 0.1], rot: 0.15 }],
  "flat-iron": [{ kind: 1, c: [-0.64, 1.5], r: [0.21, 0.065], rot: 0.25 }],
  sliced: [{ kind: 2, c: [-0.72, 1.36], r: [0.3, 0.2] }],
  ground: [
    { kind: 2, c: [-0.72, 1.3], r: [0.3, 0.24] },
    { kind: 1, c: [-0.78, 0.92], r: [0.24, 0.13] },
  ],
  burger: [
    { kind: 2, c: [-0.72, 1.3], r: [0.3, 0.24] },
    { kind: 1, c: [-0.78, 0.92], r: [0.24, 0.13] },
  ],
  // Plate & flank
  skirt: [{ kind: 2, c: [0.06, 0.96], r: [0.04, 0.2], rot: 0.3 }],
  "short-ribs": [{ kind: 2, c: [-0.15, 0.96], r: [0.22, 0.09] }],
  matambre: [{ kind: 2, c: [0.1, 0.86], r: [0.46, 0.1] }],
  flank: [{ kind: 1, c: [0.36, 0.88], r: [0.2, 0.1] }],
  // Brisket
  brisket: [{ kind: 1, c: [-0.8, 0.92], r: [0.24, 0.14] }],
};

function shapeDist(s: CutShape, x: number, y: number) {
  const a = -(s.rot ?? 0);
  const dx = x - s.c[0], dy = y - s.c[1];
  const px = dx * Math.cos(a) - dy * Math.sin(a), py = dx * Math.sin(a) + dy * Math.cos(a);
  if (s.kind === 1) return (Math.hypot(px / s.r[0], py / s.r[1]) - 1) * Math.min(s.r[0], s.r[1]);
  const qx = Math.abs(px) - s.r[0] + 0.02, qy = Math.abs(py) - s.r[1] + 0.02;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 0.02;
}

/** Signed distance from (x, y) on the side profile to a cut (negative inside). */
export const cutDist = (cut: string, x: number, y: number) => Math.min(...(CUT_SHAPES[cut] ?? []).map((s) => shapeDist(s, x, y)), 9);

/** Where the camera looks for a cut: the centre of its first shape, on the hide. */
export function cutFocus(cut: string): V3 | null {
  const s = CUT_SHAPES[cut]?.[0];
  if (!s) return null;
  return [s.c[0], s.c[1], surfaceZ(s.c[0], s.c[1]) ?? 0.42];
}

export const CUT_GLSL = /* glsl */ `
uniform vec4 uCutS[3];
uniform vec2 uCutM[3]; // (kind, rotation)
float cutShape(vec4 s, vec2 m, vec2 p) {
  if (m.x < 0.5) return 9.0;
  vec2 d = p - s.xy;
  float c = cos(-m.y), sn = sin(-m.y);
  vec2 q = vec2(d.x * c - d.y * sn, d.x * sn + d.y * c);
  if (m.x < 1.5) return (length(q / s.zw) - 1.0) * min(s.z, s.w);
  // 2 = box, 3 = bone (same shape)
  vec2 b = abs(q) - s.zw + 0.02;
  return length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.02;
}
float cutDist(vec2 p) {
  return min(cutShape(uCutS[0], uCutM[0], p), min(cutShape(uCutS[1], uCutM[1], p), cutShape(uCutS[2], uCutM[2], p)));
}
float boneDist(vec2 p) {
  float d = 9.0;
  for (int i = 0; i < 3; i++) if (uCutM[i].x > 2.5) d = min(d, cutShape(uCutS[i], uCutM[i], p));
  return d;
}`;
