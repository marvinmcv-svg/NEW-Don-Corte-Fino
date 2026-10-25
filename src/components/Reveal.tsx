"use client";

import { motion, useInView, useMotionValue, useReducedMotion, animate } from "motion/react";
import { useEffect, useRef } from "react";

/** Fades and lifts children into view once. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Heading whose words rise one by one from behind a mask. */
export function MaskText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Watch the wrapper: the words themselves sit outside their mask until revealed.
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={inView ? { y: 0 } : { y: "110%" }}
            transition={{ duration: 0.9, delay: delay + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {i < words.length - 1 ? "\u00a0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration: 1.8, ease: "easeOut" });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v) + suffix;
    });
    return () => {
      c.stop();
      unsub();
    };
  }, [inView, mv, to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

export function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.2em] text-steel">
        <span>{label}</span>
        <span className="text-champagne">{value}/5</span>
      </div>
      <div className="h-[3px] bg-champagne/10">
        <motion.div
          className="h-full bg-gradient-to-r from-burgundy to-champagne"
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 20}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
