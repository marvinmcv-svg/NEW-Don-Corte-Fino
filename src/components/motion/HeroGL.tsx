"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, LOADED_EVENT, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const frag = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uMouse;
uniform float uTime;
uniform float uVel;
uniform float uScroll;
uniform float uIntro;
varying vec2 vUv;

// 2D simplex noise (Ashima Arts)
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 scale = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 st = vUv;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);

  // Slow liquid drift so the photo is never static
  float n1 = snoise(st * 2.2 + vec2(uTime * 0.05, -uTime * 0.04));
  float n2 = snoise(st * 2.2 + vec2(-uTime * 0.04, uTime * 0.05) + 7.3);
  vec2 drift = vec2(n1, n2) * 0.006;

  // Ripple + lens around the pointer
  vec2 toM = (st - uMouse) * aspect;
  float d = length(toM);
  float lens = smoothstep(0.32, 0.0, d);
  vec2 ripple = normalize(toM + 1e-5) * sin(d * 38.0 - uTime * 3.5) * 0.01 * lens * (0.25 + uVel);
  vec2 bulge = -toM * lens * 0.06;

  // Zoom in on intro, push in on scroll
  float zoom = 1.0 - 0.12 * uScroll + 0.18 * (1.0 - uIntro);
  vec2 uv = (st - 0.5) * zoom + 0.5 + drift + ripple + bulge / aspect;
  uv = cover(uv);

  // RGB split grows with pointer speed and scroll
  float split = 0.002 + 0.012 * uVel + 0.01 * uScroll;
  vec2 dir = normalize(toM + 1e-5) / aspect;
  float r = texture2D(uTex, uv + dir * split).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - dir * split).b;
  vec3 col = vec3(r, g, b);

  // Grade: darken, push shadows to burgundy, vignette
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, col * vec3(1.08, 0.86, 0.88), 0.35);
  col = mix(vec3(0.38, 0.13, 0.18) * lum * 1.4, col, smoothstep(0.0, 0.55, lum));
  float vig = smoothstep(1.25, 0.25, length((st - vec2(0.55, 0.5)) * vec2(1.25, 1.0)));
  col *= mix(0.25, 1.0, vig);
  col *= 0.78 - 0.35 * uScroll;

  // Intro: burgundy veil peels away along a noisy diagonal edge
  float edge = st.x * 0.6 + (1.0 - st.y) * 0.4 + snoise(st * 4.0 + uTime * 0.2) * 0.08;
  float reveal = smoothstep(uIntro * 1.4 - 0.2, uIntro * 1.4 - 0.05, edge);
  col = mix(col, vec3(0.38, 0.13, 0.18) * 0.6, reveal);

  gl_FragColor = vec4(col, 1.0);
}`;

export default function HeroGL({ src, fallback, className = "" }: { src: string; fallback: string; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || prefersReducedMotion()) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL → the <img> fallback stays visible
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTex: { value: null as THREE.Texture | null },
      uRes: { value: new THREE.Vector2(1, 1) },
      uImg: { value: new THREE.Vector2(1600, 1067) },
      uMouse: { value: new THREE.Vector2(0.62, 0.45) },
      uTime: { value: 0 },
      uVel: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
    };
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms }));
    scene.add(mesh);

    new THREE.TextureLoader().load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      uniforms.uTex.value = tex;
      uniforms.uImg.value.set(tex.image.width, tex.image.height);
      el.dataset.ready = "1";
      const start = () => gsap.to(uniforms.uIntro, { value: 1, duration: 2.6, ease: "power3.inOut" });
      if ((window as unknown as { __dcfLoaded?: boolean }).__dcfLoaded) start();
      else window.addEventListener(LOADED_EVENT, start, { once: true });
    });

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      uniforms.uRes.value.set(width, height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Pointer: smoothed position + decaying velocity
    const target = new THREE.Vector2(0.62, 0.45);
    let last = { x: 0, y: 0, t: performance.now() };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      const now = performance.now();
      const v = Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(16, now - last.t);
      uniforms.uVel.value = Math.min(1, uniforms.uVel.value + v * 0.08);
      last = { x: e.clientX, y: e.clientY, t: now };
    };
    window.addEventListener("pointermove", move);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (s) => (uniforms.uScroll.value = s.progress),
    });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const clock = new THREE.Clock();
    const loop = () => {
      if (!visible) return;
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouse.value.lerp(target, 0.08);
      uniforms.uVel.value *= 0.94;
      renderer.render(scene, camera);
    };
    gsap.ticker.add(loop);

    return () => {
      gsap.ticker.remove(loop);
      window.removeEventListener("pointermove", move);
      ro.disconnect();
      io.disconnect();
      st.kill();
      uniforms.uTex.value?.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src]);

  return (
    <div ref={wrap} className={`group/gl ${className}`}>
      {/* Static fallback for no-WebGL / reduced motion; hidden once the canvas has its texture */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fallback} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-700 [[data-ready]_&]:opacity-0" />
    </div>
  );
}
