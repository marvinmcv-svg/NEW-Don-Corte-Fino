"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: { offset: -80 } });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  // New page: jump to the top (or the hash) and re-measure every trigger.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && document.querySelector(hash)) window.__lenis?.scrollTo(hash, { immediate: true, offset: -80 });
    else window.__lenis?.scrollTo(0, { immediate: true });
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, [pathname]);

  // Content that grows or shrinks after load (the 3D cow's info panel, accordions, filters, late images)
  // moves every pinned section below it. Re-measure ScrollTrigger whenever the page height really changes,
  // otherwise pins start at stale positions and the page seems to freeze or jump.
  useEffect(() => {
    let last = document.documentElement.scrollHeight;
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        const h = document.documentElement.scrollHeight;
        if (Math.abs(h - last) < 2) return;
        ScrollTrigger.refresh();
        window.__lenis?.resize();
        last = document.documentElement.scrollHeight;
      }, 200);
    });
    ro.observe(document.body);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  // The cart drawer and modals lock scrolling.
  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") window.__lenis?.stop();
      else window.__lenis?.start();
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => obs.disconnect();
  }, []);

  return null;
}
