/**
 * Bakes the procedural Wagus steer into public/models/wagus.bin so the browser skips the ~5 s meshing.
 * Run with `npm run bake:cow` after changing src/components/cow3d/sculpt.ts.
 * Layout: u32 vertexCount, u32 indexCount, f32[v*3] positions, i8[v*3] normals (padded to 4), u16|u32[i] indices.
 */
import { writeFileSync } from "node:fs";
import { buildCow } from "../src/components/cow3d/sculpt";

const { positions, normals, indices } = buildCow();
const vc = positions.length / 3;
const wide = vc > 65535;
const nBytes = Math.ceil((vc * 3) / 4) * 4;
const buf = Buffer.alloc(8 + positions.byteLength + nBytes + indices.length * (wide ? 4 : 2));
buf.writeUInt32LE(vc, 0);
buf.writeUInt32LE(indices.length | (wide ? 0x80000000 : 0), 4);
let o = 8;
Buffer.from(positions.buffer).copy(buf, o);
o += positions.byteLength;
for (let i = 0; i < normals.length; i++) buf.writeInt8(Math.round(normals[i] * 127), o + i);
o += nBytes;
for (let i = 0; i < indices.length; i++) {
  if (wide) buf.writeUInt32LE(indices[i], o + i * 4);
  else buf.writeUInt16LE(indices[i], o + i * 2);
}
writeFileSync("public/models/wagus.bin", buf);
console.log(`wagus.bin: ${vc} vertices, ${indices.length / 3} triangles, ${(buf.length / 1024).toFixed(0)} KB`);
