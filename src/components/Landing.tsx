"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { Locale } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";
import CutArt from "./CutArt";
import { MaskText } from "./Reveal";

export function Hero({ locale, d }: { locale: Locale; d: Dict["hero"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden">
      <motion.div className="velvet absolute inset-0" style={{ scale }} />
      <div className="marbling absolute inset-0 opacity-[0.06]" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir/40 via-transparent to-charcoal" />

      <div className="pointer-events-none absolute -right-40 top-[12%] w-[460px] opacity-20 sm:-right-24 sm:top-1/2 sm:w-[620px] sm:max-w-[95vw] sm:-translate-y-1/2 sm:opacity-60 md:right-[-60px] md:opacity-100 lg:right-0">
        <motion.div
          style={{ y }}
          initial={{ opacity: 0, rotate: -12, scale: 0.9 }}
          animate={{ opacity: 1, rotate: -6, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <CutArt seed="hero-ribeye" shape="steak" dense={1.4} className="w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.6)]" />
        </motion.div>
      </div>

      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-24 md:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }}>
          <Image src="/brand/mark.webp" alt="" width={96} height={96} className="mb-8 h-20 w-20 md:h-24 md:w-24" priority />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }} className="label mb-6">
          {d.kicker}
        </motion.p>
        <h1 className="h-display max-w-4xl text-[2.6rem] leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl">
          <MaskText text={d.title1} delay={0.4} />
          <br />
          <MaskText text={d.title2} delay={0.75} className="text-champagne" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-8 max-w-xl font-serif text-xl leading-relaxed text-steel md:text-2xl"
        >
          {d.sub}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.45, duration: 1 }} className="mt-10 flex flex-wrap gap-4">
          <Link href={`/${locale}/cortes`} className="btn-primary">
            {d.ctaCuts}
          </Link>
          <Link href={`/${locale}/tienda`} className="btn-ghost">
            {d.ctaShop}
          </Link>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:flex flex-col items-center gap-3">
        <span className="label text-[0.6rem]">{d.scroll}</span>
        <span className="relative h-12 w-px overflow-hidden bg-champagne/20">
          <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-champagne" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        </span>
      </div>
    </section>
  );
}

/** Serif paragraph that fills from grey to bone as you scroll through it. */
export function Manifesto({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <section className="relative px-4 py-28 md:px-8 md:py-40">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center gap-4">
          <span className="text-champagne">✦</span>
          <span className="gold-rule flex-1" />
        </div>
        <p ref={ref} className="font-serif text-3xl leading-[1.35] md:text-5xl md:leading-[1.25]">
          {words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </p>
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: ReturnType<typeof useScroll>["scrollYProgress"]; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className="text-bone">
      {children}{" "}
    </motion.span>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-champagne/10 bg-noir py-6">
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-2xl tracking-[0.08em] text-steel/80 md:text-3xl">
            {t} <span className="text-base text-wine">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
