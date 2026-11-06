/**
 * Packs public/models/wagus.bin into public/models/wagus.q.bin: the same mesh, about 2.5x smaller over the wire.
 * Run automatically by `npm run bake:cow`; run alone with `node scripts/pack-cow.mjs`.
 *
 * Packed layout, gzip-compressed as a whole (the browser inflates it with DecompressionStream):
 *   u32 vertexCount, u32 indexCount, f32[3] min, f32[3] step          (32-byte header)
 *   positions quantised to u16 per axis, stored as a low-byte plane then a high-byte plane
 *   i8[v*3] normals
 *   u16 index deltas (mod 65536), low-byte plane then high-byte plane
 * Quantisation step is ~0.05 mm on a 3.3 m steer: invisible. Planes and deltas make gzip far more effective.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const src = readFileSync(new URL("../public/models/wagus.bin", import.meta.url));
const buf = src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength);
const [vc, head1] = new Uint32Array(buf, 0, 2);
if (head1 & 0x80000000) throw new Error("pack-cow: 32-bit indices are not supported by the packed format");
const ic = head1;
let o = 8;
const pos = new Float32Array(buf, o, vc * 3);
o += vc * 12;
const n8 = new Uint8Array(buf, o, vc * 3);
o += Math.ceil((vc * 3) / 4) * 4;
const idx = new Uint16Array(buf, o, ic);

const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < pos.length; i++) {
  min[i % 3] = Math.min(min[i % 3], pos[i]);
  max[i % 3] = Math.max(max[i % 3], pos[i]);
}
const step = max.map((m, a) => (m - min[a]) / 65535 || 1);

const planes = (values) => {
  const out = new Uint8Array(values.length * 2);
  for (let i = 0; i < values.length; i++) {
    out[i] = values[i] & 255;
    out[values.length + i] = values[i] >> 8;
  }
  return out;
};
const q = new Uint16Array(vc * 3);
for (let i = 0; i < q.length; i++) q[i] = Math.round((pos[i] - min[i % 3]) / step[i % 3]);
const deltas = new Uint16Array(ic);
for (let i = 0, prev = 0; i < ic; i++) {
  deltas[i] = (idx[i] - prev) & 0xffff;
  prev = idx[i];
}

const header = new ArrayBuffer(32);
new Uint32Array(header, 0, 2).set([vc, ic]);
new Float32Array(header, 8, 6).set([...min, ...step]);
const packed = Buffer.concat([Buffer.from(header), planes(q), Buffer.from(n8), planes(deltas)]);
const out = gzipSync(packed, { level: 9 });
writeFileSync(new URL("../public/models/wagus.q.bin", import.meta.url), out);
console.log(`wagus.q.bin: ${(src.length / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB`);
