/**
 * Procedural Wagus steer: a signed-distance sculpt (smooth-unioned ellipsoids and tapered capsules)
 * meshed with naive surface nets, then relaxed onto the surface. Polled, like Angus and most Wagus.
 * Object space: head toward −x, ground at y = 0, +z faces the default camera.
 */

import { PRIMAL_ORDER, type PrimalKey } from "@/lib/cuts";

type V3 = [number, number, number];

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
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
  d = smin(d, taper(x, y, z, [-0.86, 1.28, 0], [-1.3, 1.44, 0], 0.4, 0.27), 0.16);
  d = smin(d, ellipsoid(x, y, z, [-1.12, 1.04, 0], [0.2, 0.18, 0.1]), 0.16);
  // head: broad poll, long face dropping steeply to a wide muzzle
  d = smin(d, ellipsoid(x, y, z, [-1.38, 1.55, 0], [0.19, 0.18, 0.21]), 0.1);
  d = smin(d, taper(x, y, z, [-1.43, 1.5, 0], [-1.66, 1.04, 0], 0.19, 0.14), 0.1);
  d = smin(d, ellipsoid(x, y, z, [-1.7, 0.97, 0], [0.12, 0.12, 0.16]), 0.08);
  d = smin(d, ellipsoid(x, y, z, [-1.55, 0.98, 0], [0.12, 0.07, 0.1]), 0.1); // jaw
  d = smin(d, ellipsoid(x, y, z, [-1.36, 1.5, 0.37], [0.06, 0.035, 0.16]), 0.05); // ears out sideways
  d = smin(d, ellipsoid(x, y, z, [-1.5, 1.41, 0.165], [0.03, 0.03, 0.03]), 0.03); // eyes
  // front legs
  d = smin(d, taper(x, y, z, [-0.66, 0.95, 0.21], [-0.7, 0.42, 0.21], 0.18, 0.1), 0.12);
  d = smin(d, taper(x, y, z, [-0.7, 0.42, 0.21], [-0.72, 0.07, 0.21], 0.095, 0.08), 0.04);
  d = smin(d, taper(x, y, z, [-0.73, 0.08, 0.21], [-0.76, 0.01, 0.21], 0.095, 0.09), 0.03);
  // hind legs: thigh, gaskin back to the hock, cannon down to the hoof
  d = smin(d, ellipsoid(x, y, z, [0.92, 0.96, 0.22], [0.34, 0.42, 0.21]), 0.16);
  d = smin(d, taper(x, y, z, [0.94, 0.8, 0.22], [1.02, 0.44, 0.22], 0.15, 0.095), 0.08);
  d = smin(d, taper(x, y, z, [1.02, 0.44, 0.22], [0.97, 0.07, 0.22], 0.09, 0.08), 0.04);
  d = smin(d, taper(x, y, z, [0.96, 0.08, 0.22], [0.94, 0.01, 0.22], 0.095, 0.09), 0.03);
  // tail
  d = smin(d, taper(x, y, zz, [1.27, 1.5, 0], [1.37, 0.72, 0], 0.05, 0.028), 0.06);
  d = smin(d, ellipsoid(x, y, zz, [1.38, 0.64, 0], [0.06, 0.12, 0.06]), 0.04);
  return d;
}

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

const MIN: V3 = [-1.92, -0.03, -0.62];
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
export function buildCow(cell = 0.024): CowMesh {
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
