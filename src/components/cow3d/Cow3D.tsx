"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CowMap from "@/components/CowMap";
import type { Locale } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { CUTS, PRIMALS, PRIMAL_ORDER, type PrimalKey } from "@/lib/cuts";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { getDict } from "@/lib/i18n";
import { ZONE_FOCUS, ZONE_GLSL, zoneId, zoneRect } from "./sculpt";

const MODEL_URL = "/models/wagus.bin";

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

const vert = /* glsl */ `
uniform float uSel;
uniform float uHover;
uniform float uLift;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vV;
${ZONE_GLSL}
void main() {
  vec4 r;
  float z = zoneOf(position, r);
  float lift = 0.0;
  if (z > 0.5 && abs(z - uSel) < 0.5) lift += uLift;
  if (z > 0.5 && abs(z - uHover) < 0.5) lift += 0.01;
  vec4 mv = modelViewMatrix * vec4(position + normal * lift, 1.0);
  vObj = position;
  vN = normalize(normalMatrix * normal);
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
varying vec3 vObj;
varying vec3 vN;
varying vec3 vV;
${ZONE_GLSL}
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

  // Black hide with a fine hair grain and a satin sheen
  float grain = vnoise(vObj * vec3(70.0, 220.0, 70.0));
  vec3 hide = vec3(0.05, 0.045, 0.047) * (0.8 + 0.4 * grain);
  vec3 col = hide * dif * 2.4 + spec * vec3(0.32, 0.3, 0.28) + fres * gold * 0.28;

  // Marbled Wagus underneath
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

  // Butcher's chart lines
  if (z > 0.5) {
    float d = min(min(vObj.x - r.x, r.y - vObj.x), min(vObj.y - r.z, r.w - vObj.y));
    float w = fwidth(d);
    float line = 1.0 - smoothstep(0.003, 0.006 + w, d);
    col = mix(col, gold, line * uLines * ((inSel || inHov) ? 1.0 : 0.45));
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

type Api = { select: (k: PrimalKey | null) => void };

export default function Cow3D({ locale }: { locale: Locale }) {
  const d = getDict(locale).map;
  const wrap = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [sel, setSel] = useState<PrimalKey | null>(null);
  const [hover, setHover] = useState<PrimalKey | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const { cuts } = useCatalog();
  const cutsIn = (k: PrimalKey) => cuts.filter((p) => p.cut && CUTS[p.cut]?.primal === k);

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

    const select = (k: PrimalKey | null) => {
      setSel(k);
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
    api.current = { select };

    // Pointer: drag to spin (with inertia), hover to preview, tap to pick a zone.
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
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
        select(hit?.zone && zoneId(hit.zone) !== uniforms.uSel.value ? hit.zone : null);
      }
      drag = null;
      el.style.cursor = hovered ? "pointer" : "grab";
    };
    const leave = () => setHovered(null);
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

    const clock = new THREE.Clock();
    const tagPos = new THREE.Vector3();
    const loop = () => {
      if (!visible) return;
      const t = clock.getElapsedTime();
      if (!drag && Math.abs(vel) > 0.0001) {
        rig.rotY += vel;
        vel *= 0.94;
      }
      group.rotation.y = rig.rotY + (reduced ? 0 : Math.sin(t * 0.35) * 0.22 * rig.sway);
      group.position.y = reduced ? 0 : Math.sin(t * 0.9) * 0.012 * rig.sway;
      group.updateMatrixWorld();
      focusWorld.copy(focusLocal).applyMatrix4(group.matrixWorld);
      target.copy(home).lerp(focusWorld, rig.focus * 0.85);
      camera.position.set(target.x, target.y + Math.sin(rig.tilt) * rig.dist, target.z + Math.cos(rig.tilt) * rig.dist);
      camera.lookAt(target);
      renderer.render(scene, camera);

      // Floating label pinned to the active zone
      const k = (uniforms.uSel.value ? PRIMAL_ORDER[uniforms.uSel.value - 1] : null) ?? hovered;
      if (tag.current) {
        if (k && uniforms.uIntro.value > 0.99) {
          tagPos.set(...ZONE_FOCUS[k]).applyMatrix4(group.matrixWorld).project(camera);
          const r = el.getBoundingClientRect();
          tag.current.style.transform = `translate(${((tagPos.x + 1) / 2) * r.width}px, ${((1 - tagPos.y) / 2) * r.height}px)`;
          tag.current.style.opacity = "1";
        } else tag.current.style.opacity = "0";
      }
    };
    gsap.ticker.add(loop);

    return () => {
      gsap.ticker.remove(loop);
      gsap.killTweensOf(rig);
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
      floor.geometry.dispose();
      floorMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  if (status === "fallback") return <CowMap locale={locale} />;

  const active = sel ?? hover;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div className="relative">
        <div ref={wrap} className="relative aspect-[4/3] w-full select-none md:aspect-[16/10]">
          {status === "loading" && <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,rgba(214,197,167,0.08),transparent_60%)]" />}
          <div ref={tag} className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 transition-opacity duration-300">
            <div className="-translate-x-1/2 -translate-y-[calc(100%+18px)] whitespace-nowrap border border-champagne/40 bg-noir/80 px-3 py-1.5 font-display text-xs uppercase tracking-[0.2em] text-bone backdrop-blur">
              {active && PRIMALS[active][locale]}
            </div>
            <div className="absolute left-0 top-[-18px] h-[18px] w-px bg-champagne/60" />
            <div className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-champagne" />
          </div>
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
                <ul className="space-y-1">
                  {cutsIn(active).map((p) => (
                    <li key={p.slug}>
                      <Link href={`/${locale}/cortes/${p.slug}`} className="group flex items-center justify-between border-b border-champagne/10 py-3 font-serif text-xl text-steel transition hover:text-bone">
                        {p.name[locale]}
                        <span className="text-xs uppercase tracking-[0.25em] text-champagne opacity-0 transition group-hover:opacity-100">{d.see} →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
