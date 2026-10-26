"use client";

import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, prefersReducedMotion, SplitText } from "@/lib/gsap";

gsap.registerPlugin(useGSAP);

/** Heading split into lines; each line rises from behind its own mask when scrolled into view. */
export function SplitHeading({
  children,
  as: Tag = "h2",
  className = "",
  delay = 0,
}: {
  children: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      const split = SplitText.create(ref.current, { type: "lines,words", mask: "lines", linesClass: "pb-[0.06em]" });
      gsap.from(split.words, {
        yPercent: 110,
        rotate: 4,
        duration: 1.3,
        stagger: 0.045,
        delay,
        scrollTrigger: { trigger: ref.current, start: "top 88%" },
      });
      return () => split.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/** Image that wipes open (clip-path) while settling from a zoomed-in scale, with scroll parallax. */
export function RevealImage({
  src,
  alt,
  width,
  height,
  className = "",
  imgClassName = "",
  parallax = 12,
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  from = "bottom",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  parallax?: number;
  priority?: boolean;
  sizes?: string;
  from?: "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      const img = ref.current.querySelector("img");
      const start = { bottom: "inset(100% 0% 0% 0%)", left: "inset(0% 100% 0% 0%)", right: "inset(0% 0% 0% 100%)" }[from];
      gsap.fromTo(
        ref.current,
        { clipPath: start },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ref.current, start: "top 85%" } },
      );
      if (img) {
        gsap.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: ref.current, start: "top 85%" } });
        if (parallax)
          gsap.fromTo(
            img,
            { yPercent: -parallax / 2 },
            { yPercent: parallax / 2, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
          );
      }
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`h-[115%] w-full object-cover ${imgClassName}`}
      />
    </div>
  );
}

/** Fades/lifts every direct child in a staggered cascade as the group enters. */
export function Stagger({ children, className = "", y = 60 }: { children: React.ReactNode; className?: string; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.from(ref.current.children, {
        y,
        autoAlpha: 0,
        duration: 1.3,
        stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 85%" },
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
