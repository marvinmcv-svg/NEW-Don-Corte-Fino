"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CowMap from "@/components/CowMap";
import type { Locale } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { CUTS, METHODS, PRIMALS, PRIMAL_ORDER, type PrimalKey } from "@/lib/cuts";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { getDict } from "@/lib/i18n";
import { productPhoto } from "@/lib/media";
import { CUT_GLSL, CUT_SHAPES, cutDist, cutFocus, EYE, EYE_R, NECK_PIVOT, ZONE_FOCUS, ZONE_GLSL, zoneId, zoneRect } from "./sculpt";

const MODEL_URL = "/models/wagus.bin";

/** Where the cut card settles inside the canvas box (fractions of its size). */
const CARD = { left: 0.6, top: 0.04, w: 0.4 };

/** How far the steer turns toward the camera when a zone is picked (radians around y). */
const ZONE_TURN: Record<PrimalKey, number> = {
  chuck: 0.45,
  rib: 0.12,
  loin: 0.05,
  tenderloin: 0.05,
  rump: -0.35,
  brisket: 0.85,
  plate: 0.15,
  flank: -0.05,
};

async function loadModel() {
  const buf = await (await fetch(MODEL_URL)).arrayBuffer();
  const head = new Uint32Array(buf, 0, 2);
  const vc = head[0];
  const wide = (head[1] & 0x80000000) !== 0;
  const ic = head[1] & 0x7fffffff;
  let o = 8;
  const positions = new Float32Array(buf, o, vc * 3);
  o += vc * 12;
  const n8 = new Int8Array(buf, o, vc * 3);
  o += Math.ceil((vc * 3) / 4) * 4;
  const normals = new Float32Array(vc * 3);
  for (let i = 0; i < n8.length; i++) normals[i] = n8[i] / 127;
  const indices = wide ? new Uint32Array(buf, o, ic) : new Uint16Array(buf, o, ic);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  g.computeBoundingSphere();
  return g;
}

const NOISE = /* glsl */ `
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }`;

/** Bends the head around the neck hinge, flicks the ears, swishes the tail and lets the barrel breathe. */
const DEFORM = /* glsl */ `
uniform float uTime;
uniform float uYaw;
uniform float uPitch;
uniform float uEar;
uniform vec3 uPivot;
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }
void deform(inout vec3 p, inout vec3 n) {
  // breathing: the barrel swells a few millimetres
  float body = smoothstep(-1.0, -0.6, p.x) * smoothstep(1.25, 0.85, p.x) * smoothstep(0.62, 0.95, p.y);
  p += n * sin(uTime * 1.5) * 0.0045 * body;
  // tail swish, stronger toward the switch
  float tail = smoothstep(1.28, 1.34, p.x) * smoothstep(1.05, 0.7, p.y) * step(abs(p.z), 0.1);
  p.z += sin(uTime * 1.3 - p.y * 2.0) * 0.1 * tail * (1.05 - p.y) * 2.0;
  // ear flick
  float ear = smoothstep(0.25, 0.34, abs(p.z)) * smoothstep(-1.2, -1.28, p.x) * smoothstep(1.35, 1.42, p.y);
  p.y += uEar * (abs(p.z) - 0.25) * 0.9 * ear;
  // head turn around the neck
  float w = smoothstep(uPivot.x + 0.05, uPivot.x - 0.28, p.x) * smoothstep(0.75, 0.95, p.y);
  vec3 q = p - uPivot;
  q = rotY(rotZ(q, uPitch * w), uYaw * w);
  p = q + uPivot;
  n = rotY(rotZ(n, uPitch * w), uYaw * w);
}`;

const vert = /* glsl */ `
uniform float uSel;
uniform float uHover;
uniform float uLift;
uniform float uCutAmt;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vV;
${ZONE_GLSL}
${CUT_GLSL}
${DEFORM}
void main() {
  vec4 r;
  float z = zoneOf(position, r);
  float lift = 0.0;
  if (z > 0.5 && abs(z - uSel) < 0.5) lift += uLift * (1.0 - uCutAmt);
  if (z > 0.5 && abs(z - uHover) < 0.5) lift += 0.01;
  if (uCutAmt > 0.0 && cutDist(position.xy) < 0.0) lift += 0.07 * uCutAmt;
  vec3 p = position;
  vec3 n = normal;
  deform(p, n);
  vec4 mv = modelViewMatrix * vec4(p + n * lift, 1.0);
  vObj = position;
  vN = normalize(normalMatrix * n);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform float uSel;
uniform float uHover;
uniform float uSelAmt;
uniform float uHoverAmt;
uniform float uIntro;
uniform float uLines;
uniform vec3 uClick;
uniform float uClickT;
uniform float uCutAmt;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vV;
${ZONE_GLSL}
${CUT_GLSL}
${NOISE}
void main() {
  // Intro: the steer materialises from tail to nose behind a glowing champagne edge.
  float e = (1.6 - vObj.x) / 3.6 * 0.78 + vnoise(vObj * 7.0) * 0.22;
  float cut = uIntro * 1.08;
  if (e > cut) discard;

  vec4 r;
  float z = zoneOf(vObj, r);
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(vV);
  vec3 L1 = normalize(vec3(-0.45, 0.75, 0.6));
  vec3 L2 = normalize(vec3(0.8, 0.15, -0.2));
  float dif = max(dot(N, L1), 0.0) * 0.95 + max(dot(N, L2), 0.0) * 0.3 + 0.12;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 H = normalize(L1 + V);
  float spec = pow(max(dot(N, H), 0.0), 36.0);
  vec3 gold = vec3(0.84, 0.77, 0.65);

  // Black hide with a fine hair grain, a warm brown cast where the light rakes it, and a satin sheen
  float grain = vnoise(vObj * vec3(70.0, 220.0, 70.0));
  float patchy = fbm(vObj * 2.5);
  vec3 hide = mix(vec3(0.04, 0.037, 0.039), vec3(0.06, 0.044, 0.038), patchy * 0.6) * (0.8 + 0.4 * grain);
  // soft ambient occlusion: belly, between the legs and toward the ground
  float ao = mix(0.45, 1.0, smoothstep(0.0, 0.9, vObj.y)) * mix(0.7, 1.0, smoothstep(-0.6, 0.3, N.y));
  float hem = 0.5 + 0.5 * N.y;
  vec3 col = hide * (dif * 2.4 + hem * 0.2) * ao + spec * vec3(0.34, 0.3, 0.27) * ao + fres * gold * 0.28;

  // Wet, slate-grey muzzle with dark nostrils
  float muzzle = smoothstep(-1.68, -1.78, vObj.x) * smoothstep(1.13, 1.05, vObj.y);
  if (muzzle > 0.0) {
    float nos = smoothstep(0.03, 0.012, length((vObj - vec3(-1.852, 1.0, sign(vObj.z) * 0.058)) * vec3(1.0, 1.1, 1.3)));
    vec3 skin = mix(vec3(0.11, 0.1, 0.105), vec3(0.16, 0.13, 0.13), vnoise(vObj * 60.0)) * (0.5 + dif * 1.4);
    skin += pow(max(dot(N, H), 0.0), 80.0) * 0.9;
    skin = mix(skin, vec3(0.01), nos);
    col = mix(col, skin, muzzle);
  }
  // Hooves: dark horn with a dull shine
  float hoof = smoothstep(0.09, 0.07, vObj.y);
  col = mix(col, vec3(0.06, 0.05, 0.045) * (0.6 + dif * 1.6) + pow(max(dot(N, H), 0.0), 20.0) * 0.25, hoof);

  // Marbled Wangus underneath
  bool inSel = z > 0.5 && abs(z - uSel) < 0.5;
  bool inHov = z > 0.5 && abs(z - uHover) < 0.5;
  float reveal = max(inSel ? uSelAmt : 0.0, inHov ? uHoverAmt * 0.6 : 0.0);
  if (reveal > 0.001) {
    float ridge = 1.0 - abs(fbm(vObj * vec3(9.0, 13.0, 9.0)) * 2.0 - 1.0);
    float ridge2 = 1.0 - abs(fbm(vObj * vec3(26.0, 34.0, 26.0) + 3.1) * 2.0 - 1.0);
    float fat = clamp(smoothstep(0.93, 0.985, ridge) + smoothstep(0.95, 0.99, ridge2) * 0.7, 0.0, 1.0);
    vec3 red = mix(vec3(0.36, 0.035, 0.06), vec3(0.6, 0.09, 0.11), fbm(vObj * 18.0));
    vec3 meat = mix(red, vec3(0.96, 0.9, 0.84), fat);
    vec3 meatLit = meat * (0.4 + 0.8 * dif) + spec * 0.5 + fres * vec3(0.9, 0.45, 0.45) * 0.25;
    col = mix(col, meatLit, reveal);
  }
  if (uSel > 0.5 && !inSel) col *= 1.0 - 0.45 * uSelAmt;

  // A single cut: everything else turns to a dark x-ray ghost, the cut glows solid
  float cd = 9.0;
  if (uCutAmt > 0.001) {
    cd = cutDist(vObj.xy);
    float inCut = 1.0 - smoothstep(-0.004, 0.004, cd);
    vec3 ghost = vec3(0.02) + fres * gold * 0.45 + spec * 0.05;
    float ridge = 1.0 - abs(fbm(vObj * vec3(11.0, 15.0, 11.0) + 1.7) * 2.0 - 1.0);
    float fat = smoothstep(0.92, 0.985, ridge);
    vec3 meat = mix(mix(vec3(0.42, 0.04, 0.07), vec3(0.68, 0.11, 0.13), fbm(vObj * 20.0)), vec3(0.97, 0.91, 0.85), fat);
    vec3 cutCol = meat * (0.45 + 0.85 * dif) + spec * 0.45 + fres * vec3(1.0, 0.55, 0.5) * 0.3;
    // bone: ivory with a porous grain and a pink marrow line
    float bd = boneDist(vObj.xy);
    if (bd < 0.0) {
      vec3 bone = mix(vec3(0.86, 0.8, 0.68), vec3(0.95, 0.91, 0.82), vnoise(vObj * 90.0));
      bone = mix(bone, vec3(0.7, 0.38, 0.36), smoothstep(-0.006, -0.012, bd) * 0.35);
      cutCol = bone * (0.5 + 0.7 * dif) + spec * 0.3;
    }
    col = mix(col, mix(ghost, cutCol, inCut), uCutAmt);
  }

  // Butcher's chart lines
  if (z > 0.5) {
    float d = min(min(vObj.x - r.x, r.y - vObj.x), min(vObj.y - r.z, r.w - vObj.y));
    float w = fwidth(d);
    float line = 1.0 - smoothstep(0.003, 0.006 + w, d);
    col = mix(col, gold, line * uLines * ((inSel || inHov) ? 1.0 : 0.45) * (1.0 - 0.7 * uCutAmt));
  }
  if (uCutAmt > 0.001) {
    float w = fwidth(cd);
    float edge = 1.0 - smoothstep(0.004, 0.008 + w, abs(cd));
    col = mix(col, vec3(1.0, 0.93, 0.8), edge * uCutAmt);
  }

  // Pulse that ripples out from the click
  if (uClickT < 1.6) {
    float ring = smoothstep(0.05, 0.0, abs(length(vObj - uClick) - uClickT * 1.5)) * (1.0 - uClickT / 1.6);
    col += gold * ring;
  }

  col += gold * smoothstep(cut - 0.06, cut, e) * 1.4;
  gl_FragColor = vec4(col, 1.0);
}`;

const floorFrag = /* glsl */ `
uniform float uIntro;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * vec2(1.0, 2.2);
  float shadow = smoothstep(0.42, 0.0, length(p * vec2(1.0, 1.0))) * 0.75;
  float ring = smoothstep(0.012, 0.0, abs(length(p) - 0.47)) * 0.22;
  gl_FragColor = vec4(mix(vec3(0.0), vec3(0.84, 0.77, 0.65), ring / max(shadow + ring, 0.001)), (shadow + ring) * uIntro);
}`;

/** Wet, dark-brown eye with a horizontal pupil, a catch-light and a bright cornea rim. */
const eyeVert = /* glsl */ `
varying vec3 vP;
varying vec3 vN;
varying vec3 vV;
void main() {
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const eyeFrag = /* glsl */ `
uniform float uR;
varying vec3 vP;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  // local +z looks out of the socket
  vec2 q = vP.xy / uR;
  float r = length(q * vec2(1.0, 1.15));
  float front = smoothstep(0.0, 0.5, vP.z / uR);
  vec3 sclera = vec3(0.16, 0.11, 0.09);
  vec3 iris = mix(vec3(0.16, 0.08, 0.04), vec3(0.32, 0.18, 0.08), smoothstep(0.75, 0.2, r));
  float pupil = 1.0 - smoothstep(0.26, 0.3, length(q * vec2(0.65, 1.9)));
  vec3 col = mix(sclera, iris, front * (1.0 - smoothstep(0.82, 0.9, r)));
  col = mix(col, vec3(0.005), pupil * front);
  vec3 L = normalize(vec3(-0.45, 0.75, 0.6));
  vec3 H = normalize(L + V);
  col *= 0.35 + 0.9 * max(dot(N, L), 0.0);
  col += pow(max(dot(N, H), 0.0), 140.0) * 1.6;
  col += pow(1.0 - max(dot(N, V), 0.0), 4.0) * vec3(0.84, 0.77, 0.65) * 0.35;
  gl_FragColor = vec4(col, 1.0);
}`;

type Api = { select: (k: PrimalKey | null) => void; selectCut: (slug: string | null, cut: string | null) => void };

export default function Cow3D({ locale }: { locale: Locale }) {
  const d = getDict(locale).map;
  const wrap = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  /** Where the chosen cut sits on screen (px inside the canvas box), so its card can fly out from there. */
  const popFrom = useRef({ x: 0, y: 0, w: 1, h: 1 });
  const [sel, setSel] = useState<PrimalKey | null>(null);
  const [hover, setHover] = useState<PrimalKey | null>(null);
  const [cutSel, setCutSel] = useState<string | null>(null); // product slug
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const { cuts } = useCatalog();
  const cutsIn = (k: PrimalKey) => cuts.filter((p) => p.cut && CUTS[p.cut]?.primal === k);
  const cutsRef = useRef(cuts);
  cutsRef.current = cuts;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setStatus("fallback");
      return;
    }
    const reduced = prefersReducedMotion();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "absolute inset-0 h-full w-full touch-pan-y";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    const group = new THREE.Group();
    scene.add(group);

    const uniforms = {
      uSel: { value: 0 },
      uHover: { value: 0 },
      uLift: { value: 0 },
      uSelAmt: { value: 0 },
      uHoverAmt: { value: 0 },
      uIntro: { value: reduced ? 1 : 0 },
      uLines: { value: reduced ? 1 : 0 },
      uClick: { value: new THREE.Vector3(0, -10, 0) },
      uClickT: { value: 9 },
      uTime: { value: 0 },
      uYaw: { value: 0.1 },
      uPitch: { value: 0.05 },
      uEar: { value: 0 },
      uPivot: { value: new THREE.Vector3(...NECK_PIVOT) },
      uCutAmt: { value: 0 },
      uCutS: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
      uCutM: { value: [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()] },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, side: THREE.DoubleSide });
    let mesh: THREE.Mesh | null = null;

    const floorMat = new THREE.ShaderMaterial({
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: floorFrag,
      uniforms: { uIntro: uniforms.uIntro },
      transparent: true,
      depthWrite: false,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-0.15, 0.002, 0);
    group.add(floor);

    // Eyes ride on a head pivot that turns exactly like the vertex shader bends the head.
    const head = new THREE.Group();
    head.position.set(...NECK_PIVOT);
    head.rotation.order = "YZX";
    group.add(head);
    const eyeGeo = new THREE.SphereGeometry(EYE_R, 32, 24);
    const eyeMat = new THREE.ShaderMaterial({ vertexShader: eyeVert, fragmentShader: eyeFrag, uniforms: { uR: { value: EYE_R } } });
    const eyes = [1, -1].map((side) => {
      const m = new THREE.Mesh(eyeGeo, eyeMat);
      m.position.set(EYE[0] - NECK_PIVOT[0], EYE[1] - NECK_PIVOT[1], EYE[2] * side);
      // look outward and a little forward, like a cow's wide-set eyes
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-0.3, 0.1, side * 0.95).normalize());
      m.visible = reduced;
      head.add(m);
      return m;
    });

    // Camera rig: orbit angle + distance around a target that drifts toward the chosen zone.
    const rig = { rotY: 0.32, tilt: 0.14, dist: 5.3, focus: 0, sway: 1 };
    const home = new THREE.Vector3(-0.2, 0.95, 0);
    const focusLocal = new THREE.Vector3();
    const focusWorld = new THREE.Vector3();
    const target = new THREE.Vector3();

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      // keep the whole steer in frame on tall, narrow screens
      rig.dist = Math.max(5.3, 5.3 * (1.3 / camera.aspect));
      camera.updateProjectionMatrix();
    };
    resize();
    const homeDist = () => Math.max(5.3, 5.3 * (1.3 / camera.aspect));
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let cutKey: string | null = null;
    const cutTag = new THREE.Vector3();
    const clearCut = () => {
      if (!cutKey) return;
      cutKey = null;
      setCutSel(null);
      gsap.to(uniforms.uCutAmt, { value: 0, duration: 0.5, overwrite: true });
    };

    const select = (k: PrimalKey | null) => {
      setSel(k);
      clearCut();
      gsap.killTweensOf(rig);
      gsap.killTweensOf(uniforms.uSelAmt);
      if (k) {
        uniforms.uSel.value = zoneId(k);
        focusLocal.set(...ZONE_FOCUS[k]);
        gsap.fromTo(uniforms.uSelAmt, { value: 0 }, { value: 1, duration: 0.9, ease: "power2.out" });
        gsap.fromTo(uniforms.uLift, { value: 0 }, { value: 0.045, duration: 1.1, ease: "elastic.out(1, 0.45)" });
        gsap.to(rig, { rotY: ZONE_TURN[k], tilt: 0.1, dist: homeDist() * 0.78, focus: 1, sway: 0, duration: 1.6, ease: "expo.inOut" });
      } else {
        gsap.to(uniforms.uSelAmt, { value: 0, duration: 0.5, onComplete: () => void (uniforms.uSel.value = 0) });
        gsap.to(uniforms.uLift, { value: 0, duration: 0.5 });
        gsap.to(rig, { rotY: 0.32, tilt: 0.14, dist: homeDist(), focus: 0, sway: 1, duration: 1.6, ease: "expo.inOut" });
      }
    };

    /** Show one cut on its own: the rest of the steer ghosts out and the cut lifts off the hide. */
    const selectCut = (slug: string | null, cut: string | null) => {
      const shapes = cut ? CUT_SHAPES[cut] : null;
      if (!slug || !cut || !shapes) {
        const k = uniforms.uSel.value ? PRIMAL_ORDER[uniforms.uSel.value - 1] : null;
        clearCut();
        if (k) gsap.to(rig, { rotY: ZONE_TURN[k], tilt: 0.1, dist: homeDist() * 0.78, focus: 1, duration: 1.2, ease: "expo.inOut" });
        if (k) focusLocal.set(...ZONE_FOCUS[k]);
        return;
      }
      const primal = CUTS[cut]?.primal;
      if (primal && uniforms.uSel.value !== zoneId(primal)) select(primal);
      cutKey = cut;
      setCutSel(slug);
      uniforms.uCutS.value.forEach((v, i) => {
        const sh = shapes[i];
        if (sh) v.set(sh.c[0], sh.c[1], sh.r[0], sh.r[1]);
        uniforms.uCutM.value[i].set(sh ? sh.kind : 0, sh?.rot ?? 0);
      });
      const f = cutFocus(cut);
      if (f) focusLocal.set(...f);
      // the label sits just above the top of the cut
      const topY = Math.max(...shapes.map((sh) => sh.c[1] + (sh.kind === 1 ? sh.r[1] : Math.hypot(sh.r[0], sh.r[1]))));
      cutTag.set(shapes[0].c[0], topY + 0.04, f ? f[2] : 0.42);
      {
        const v = new THREE.Vector3(shapes[0].c[0], shapes[0].c[1], f ? f[2] : 0.42).applyMatrix4(group.matrixWorld).project(camera);
        const r = el.getBoundingClientRect();
        popFrom.current = { x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height, w: r.width, h: r.height };
      }
      gsap.fromTo(uniforms.uCutAmt, { value: 0 }, { value: 1, duration: 1.1, ease: "power3.out", overwrite: true });
      gsap.killTweensOf(rig);
      gsap.to(rig, { rotY: primal ? ZONE_TURN[primal] * 0.6 : 0.1, tilt: 0.12, dist: homeDist() * 0.72, focus: 1, sway: 0, duration: 1.5, ease: "expo.inOut" });
    };
    api.current = { select, selectCut };

    // Pointer: drag to spin (with inertia), hover to preview, tap to pick a zone or a cut.
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const look = { x: 0, y: 0, active: false };
    let drag: { x: number; y: number; moved: number } | null = null;
    let vel = 0;
    let hovered: PrimalKey | null = null;
    const pick = (e: PointerEvent) => {
      if (!mesh) return null;
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(mesh)[0];
      if (!hit) return null;
      const p = mesh.worldToLocal(hit.point.clone());
      return { point: p, zone: zoneRect(p.x, p.y)?.key ?? null };
    };
    const setHovered = (k: PrimalKey | null) => {
      if (k === hovered) return;
      hovered = k;
      setHover(k);
      el.style.cursor = k ? "pointer" : "grab";
      if (k) {
        uniforms.uHover.value = zoneId(k);
        gsap.fromTo(uniforms.uHoverAmt, { value: 0 }, { value: 1, duration: 0.4, overwrite: true });
      } else gsap.to(uniforms.uHoverAmt, { value: 0, duration: 0.3, overwrite: true, onComplete: () => void (uniforms.uHover.value = 0) });
    };
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      vel = 0;
      gsap.killTweensOf(rig, "rotY,tilt");
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      look.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      look.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      look.active = Math.abs(look.x) < 1.6 && Math.abs(look.y) < 1.6;
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        drag.x = e.clientX;
        drag.y = e.clientY;
        if (e.pointerType !== "touch" || Math.abs(dx) > Math.abs(dy)) {
          vel = dx * 0.009;
          rig.rotY += vel;
          rig.tilt = gsap.utils.clamp(-0.05, 0.45, rig.tilt + dy * 0.003 * (e.pointerType === "touch" ? 0 : 1));
          rig.sway = 0;
        }
        if (drag.moved > 6) el.style.cursor = "grabbing";
      } else if (e.pointerType === "mouse") setHovered(pick(e)?.zone ?? null);
    };
    const up = (e: PointerEvent) => {
      if (drag && drag.moved < 6) {
        const hit = pick(e);
        if (hit?.zone) {
          uniforms.uClick.value.copy(hit.point);
          gsap.fromTo(uniforms.uClickT, { value: 0 }, { value: 1.6, duration: 1.6, ease: "none" });
        }
        // Inside the chosen zone, a tap on a cut shows that cut on its own
        const cur = uniforms.uSel.value;
        const inSel = hit?.zone && zoneId(hit.zone) === cur;
        const hitCut =
          hit && cur
            ? cutsRef.current.find((p) => p.cut && CUTS[p.cut]?.primal === PRIMAL_ORDER[cur - 1] && CUT_SHAPES[p.cut] && cutDist(p.cut, hit.point.x, hit.point.y) < 0)
            : undefined;
        if (hitCut && hitCut.cut !== cutKey) selectCut(hitCut.slug, hitCut.cut);
        else if (inSel && cutKey) selectCut(null, null);
        else select(hit?.zone && !inSel ? hit.zone : null);
      }
      drag = null;
      el.style.cursor = hovered ? "pointer" : "grab";
    };
    const leave = () => {
      setHovered(null);
      look.active = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", leave);

    let visible = false;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { rootMargin: "100px" });
    io.observe(el);

    let intro: ScrollTrigger | null = null;
    loadModel()
      .then((geometry) => {
        mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        setStatus("ready");
        el.style.cursor = "grab";
        if (reduced) return;
        intro = ScrollTrigger.create({
          trigger: el,
          start: "top 75%",
          once: true,
          onEnter: () => {
            gsap.to(uniforms.uIntro, { value: 1, duration: 2.4, ease: "power2.inOut" });
            gsap.to(uniforms.uLines, { value: 1, duration: 1.2, delay: 1.9 });
            gsap.from(rig, { rotY: -0.9, dist: homeDist() * 1.25, duration: 3, ease: "expo.out" });
          },
        });
      })
      .catch(() => setStatus("fallback"));

    // Little signs of life: blinks and ear flicks at uneven intervals
    const timers: number[] = [];
    if (!reduced) {
      const blink = () => {
        gsap.to(eyes.map((e) => e.scale), { y: 0.08, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.in" });
        timers[0] = window.setTimeout(blink, 2200 + Math.random() * 4200);
      };
      const flick = () => {
        gsap.fromTo(uniforms.uEar, { value: 0 }, { value: Math.random() < 0.5 ? 0.35 : -0.25, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" });
        timers[1] = window.setTimeout(flick, 3500 + Math.random() * 6000);
      };
      timers[0] = window.setTimeout(blink, 2500);
      timers[1] = window.setTimeout(flick, 4000);
    }

    // Animation time only advances while the steer is on screen, so nothing jumps when it scrolls back in
    const clock = new THREE.Clock();
    let time = 0;
    const tagPos = new THREE.Vector3();
    const headPos = new THREE.Vector3();
    const loop = () => {
      if (!visible) {
        clock.getDelta();
        return;
      }
      time += Math.min(clock.getDelta(), 1 / 20);
      const t = time;
      uniforms.uTime.value = reduced ? 0 : t;
      if (!drag && Math.abs(vel) > 0.0001) {
        rig.rotY += vel;
        vel *= 0.94;
      }
      group.rotation.y = rig.rotY + (reduced ? 0 : Math.sin(t * 0.35) * 0.22 * rig.sway);
      group.position.y = reduced ? 0 : Math.sin(t * 0.9) * 0.012 * rig.sway;
      group.updateMatrixWorld();

      // Head follows the pointer; otherwise it idles, glancing around
      if (!reduced) {
        let yaw = 0.12 + Math.sin(t * 0.31) * 0.22 + Math.sin(t * 0.13) * 0.1;
        let pitch = 0.06 + Math.sin(t * 0.23) * 0.07;
        if (look.active && !drag) {
          headPos.set(...EYE).applyMatrix4(group.matrixWorld).project(camera);
          yaw = gsap.utils.clamp(-0.45, 0.85, 0.1 + (look.x - headPos.x) * 0.9);
          pitch = gsap.utils.clamp(-0.3, 0.32, -(look.y - headPos.y) * 0.7);
        }
        uniforms.uYaw.value += (yaw - uniforms.uYaw.value) * 0.05;
        uniforms.uPitch.value += (pitch - uniforms.uPitch.value) * 0.05;
      }
      head.rotation.set(0, uniforms.uYaw.value, uniforms.uPitch.value);
      const showEyes = uniforms.uIntro.value > 0.86;
      eyes.forEach((e) => (e.visible = showEyes && uniforms.uCutAmt.value < 0.5));

      focusWorld.copy(focusLocal).applyMatrix4(group.matrixWorld);
      target.copy(home).lerp(focusWorld, rig.focus * 0.85);
      camera.position.set(target.x, target.y + Math.sin(rig.tilt) * rig.dist, target.z + Math.cos(rig.tilt) * rig.dist);
      camera.lookAt(target);
      renderer.render(scene, camera);

      // Floating label pinned to the active cut or zone
      const k = (uniforms.uSel.value ? PRIMAL_ORDER[uniforms.uSel.value - 1] : null) ?? hovered;
      if (tag.current) {
        if (k && uniforms.uIntro.value > 0.99 && !cutKey) {
          if (cutKey) tagPos.copy(cutTag);
          else tagPos.set(...ZONE_FOCUS[k]);
          tagPos.applyMatrix4(group.matrixWorld).project(camera);
          const r = el.getBoundingClientRect();
          tag.current.style.transform = `translate(${((tagPos.x + 1) / 2) * r.width}px, ${((1 - tagPos.y) / 2) * r.height}px)`;
          tag.current.style.opacity = "1";
        } else tag.current.style.opacity = "0";
      }
    };
    gsap.ticker.add(loop);

    return () => {
      gsap.ticker.remove(loop);
      timers.forEach((id) => window.clearTimeout(id));
      gsap.killTweensOf(rig);
      gsap.killTweensOf(eyes.map((e) => e.scale));
      Object.values(uniforms).forEach((u) => gsap.killTweensOf(u));
      intro?.kill();
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", leave);
      mesh?.geometry.dispose();
      material.dispose();
      eyeGeo.dispose();
      eyeMat.dispose();
      floor.geometry.dispose();
      floorMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  if (status === "fallback") return <CowMap locale={locale} />;

  const active = sel ?? hover;
  const chosen = cutSel ? cuts.find((p) => p.slug === cutSel) : null;
  const info = chosen?.cut ? CUTS[chosen.cut] : null;
  const photoSrc = chosen ? productPhoto(chosen)?.main.src : undefined;
  // Offset from the card's resting centre back to the cut on the steer, so it flies out of the body
  const pop = (() => {
    if (!chosen || !photoSrc) return null;
    const f = popFrom.current;
    const cx = (CARD.left + CARD.w / 2) * f.w;
    const cy = CARD.top * f.h + (CARD.w * f.w * 0.75) / 2 + 30;
    return { photo: photoSrc, dx: f.x - cx, dy: f.y - cy };
  })();
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div className="relative">
        <div ref={wrap} className="relative aspect-[4/3] w-full select-none md:aspect-[16/10]">
          {status === "loading" && <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,rgba(214,197,167,0.08),transparent_60%)]" />}
          <div ref={tag} className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 transition-opacity duration-300">
            <div className="-translate-x-1/2 -translate-y-[calc(100%+18px)] whitespace-nowrap border border-champagne/40 bg-noir/80 px-3 py-1.5 font-display text-xs uppercase tracking-[0.2em] text-bone backdrop-blur">
              <span>{chosen ? chosen.name[locale] : active && PRIMALS[active][locale]}</span>
            </div>
            <div className="absolute left-0 top-[-18px] h-[18px] w-px bg-champagne/60" />
            <div className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-champagne" />
          </div>
        </div>
        {/* The chosen cut comes out of the steer toward you, as a photo of the real piece */}
        <div className="pointer-events-none absolute inset-0 z-20 [perspective:1100px]">
          <AnimatePresence>
            {chosen && pop && (
              <motion.div
                key={chosen.slug}
                initial={{ x: pop.dx, y: pop.dy, z: -500, scale: 0.08, rotateY: -80, rotateX: 35, opacity: 0.85 }}
                animate={{ x: 0, y: 0, z: 0, scale: 1, rotateY: -14, rotateX: 5, opacity: 1 }}
                exit={{ x: pop.dx, y: pop.dy, z: -700, scale: 0.1, rotateY: -75, rotateX: 30, opacity: 0, transition: { duration: 0.55, ease: [0.6, 0, 0.8, 0.4] } }}
                transition={{ type: "spring", stiffness: 38, damping: 11, mass: 1.4, restDelta: 0.001 }}
                style={{ transformStyle: "preserve-3d", left: `${CARD.left * 100}%`, top: `${CARD.top * 100}%`, width: `${CARD.w * 100}%` }}
                className="pointer-events-auto absolute"
              >
                <div className="animate-[dcf-float_6s_ease-in-out_infinite] [transform-style:preserve-3d]">
                  <div className="relative overflow-hidden border border-champagne/40 bg-noir shadow-[0_50px_90px_rgba(0,0,0,0.75),0_0_0_1px_rgba(214,197,167,0.08)]">
                    <div className="relative aspect-[4/3]">
                      <Image src={pop.photo} alt={chosen.name[locale]} fill sizes="(min-width:1024px) 30vw, 60vw" className="object-cover" />
                      {/* glossy light sweep across the photo, like a print catching the light */}
                      <div className="absolute inset-0 animate-[dcf-gloss_4.5s_ease-in-out_infinite] bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.22)_48%,transparent_60%)] bg-[length:250%_100%]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-noir/85 via-transparent to-transparent" />
                      <button
                        type="button"
                        onClick={() => api.current?.selectCut(null, null)}
                        aria-label={locale === "es" ? "Cerrar" : "Close"}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-noir/70 text-bone backdrop-blur transition hover:bg-burgundy"
                      >
                        ×
                      </button>
                      <p className="absolute inset-x-3 bottom-2 font-display text-base uppercase tracking-[0.12em] text-bone md:text-xl">{chosen.name[locale]}</p>
                    </div>
                    {info && (
                      <div className="hidden gap-2 p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between md:p-4">
                        <div className="flex flex-wrap gap-1">
                          {info.methods.slice(0, 3).map((m) => (
                            <span key={m} className="border border-champagne/25 px-1.5 py-0.5 text-[0.58rem] uppercase tracking-[0.15em] text-champagne">
                              {METHODS[m][locale]}
                            </span>
                          ))}
                        </div>
                        <Link href={`/${locale}/cortes/${chosen.slug}`} className="text-[0.65rem] uppercase tracking-[0.2em] text-champagne hover:text-bone">
                          {d.see} →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="label pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.58rem] text-steel/70">↔ {d.drag}</p>
      </div>

      <div className="min-h-72">
        <p className="label mb-4">{d.hint}</p>
        <div className="mb-8 flex flex-wrap gap-2">
          {PRIMAL_ORDER.map((k) => (
            <button key={k} onClick={() => api.current?.select(sel === k ? null : k)} className={`chip ${sel === k ? "chip-on" : ""}`}>
              {PRIMALS[k][locale]}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {active && (
            <motion.div key={active} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
              <h3 className="h-display text-3xl md:text-4xl">{PRIMALS[active][locale]}</h3>
              <div className="gold-rule my-5" />
              {cutsIn(active).length === 0 ? (
                <p className="text-ash">{d.noCuts}</p>
              ) : (
                <>
                  <p className="mb-2 text-xs uppercase tracking-[0.25em] text-ash">{d.pickCut}</p>
                  <ul className="space-y-1">
                    {cutsIn(active).map((p) => {
                      const on = cutSel === p.slug;
                      const ci = p.cut ? CUTS[p.cut] : null;
                      return (
                        <li key={p.slug} className={`border-b transition-colors ${on ? "border-champagne/50" : "border-champagne/10"}`}>
                          <button
                            onClick={() => api.current?.selectCut(on ? null : p.slug, on ? null : p.cut)}
                            aria-pressed={on}
                            className={`group flex w-full items-center justify-between py-3 text-left font-serif text-xl transition ${on ? "text-bone" : "text-steel hover:text-bone"}`}
                          >
                            <span className="flex items-center gap-3">
                              <span className={`h-2 w-2 rounded-full border border-champagne transition ${on ? "bg-champagne" : "bg-transparent"}`} />
                              {p.name[locale]}
                            </span>
                            <span className="text-xs uppercase tracking-[0.25em] text-champagne opacity-0 transition group-hover:opacity-100">{on ? "×" : d.show3d}</span>
                          </button>
                          <AnimatePresence initial={false}>
                            {on && ci && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                                <p className="pb-3 text-sm leading-relaxed text-ash">{ci.story[locale].split(". ")[0]}.</p>
                                <div className="flex flex-wrap gap-1.5 pb-3">
                                  {ci.methods.map((m) => (
                                    <span key={m} className="border border-champagne/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.15em] text-champagne">
                                      {METHODS[m][locale]}
                                    </span>
                                  ))}
                                </div>
                                <Link href={`/${locale}/cortes/${p.slug}`} className="mb-4 inline-block text-xs uppercase tracking-[0.25em] text-champagne hover:text-bone">
                                  {d.see} →
                                </Link>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {info && <span className="sr-only" aria-live="polite">{chosen?.name[locale]}</span>}
      </div>
    </div>
  );
}
