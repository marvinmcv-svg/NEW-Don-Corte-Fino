# Master Prompt — Scroll-Pinned Clip-Path Zoom Reveal

**Also known as:** zoom-through mask transition · pinned image expand · "scroll to zoom into the next scene".
**Stack:** GSAP ScrollTrigger (`pin` + `scrub`) + CSS `clip-path: inset(... round ...)`, framework-agnostic (React/Next.js shown).
**Reference build:** Don Corte Fino, the `MarblingSection` in `src/components/landing/Sections.tsx`.

The sequence: a giant word sits over a small rounded window showing a close-up photo. As the user scrolls, the section pins, the letters scatter up and fade, and the window grows until the photo fills the screen while it de-zooms. The image then darkens and the next scene's copy rises in, so it feels like you zoomed *through* the word into a new page.

Copy everything below the line into your AI coding tool and fill in the `[BRACKETS]`.

---

## PROMPT

Build a full-screen, scroll-driven "Pinned Clip-Path Zoom Reveal" section for **[BRAND]**.

### 1. Markup
```
<section ref=root class="relative h-[100svh] min-h-[680px] overflow-hidden bg-[DARK]">
  <div data-frame class="absolute inset-0 overflow-hidden">          ← clipped window
    <img src="[CLOSE_UP_IMAGE]" class="h-full w-full object-cover" /> ← scaled inside
    <div data-shade class="absolute inset-0 bg-[DARK] opacity-0" />   ← darkens at the end
  </div>
  <h2 data-big class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2
      whitespace-nowrap text-center font-display text-[13vw] leading-none text-[LIGHT]
      drop-shadow-[0_10px_40px_rgba(0,0,0,.6)]">
    <!-- one <span class="inline-block"> per letter of [BIG_WORD] (uppercase) -->
  </h2>
  <div data-copy class="absolute inset-x-0 bottom-0 ...">            ← next scene's copy
    kicker · heading · short body · optional data card with bars [data-bar]
  </div>
</section>
```
Pick a close-up macro photo with strong texture (marbling, fabric, stone, skin, liquid). Texture is what makes the zoom feel physical.

### 2. Timeline (one ScrollTrigger, everything scrubbed)
```js
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: "top top", end: "+=220%", scrub: 1, pin: true, anticipatePin: 1 },
  });
  const startClip = innerWidth < 768
    ? "inset(28% 10% 28% 10% round 160px)"     // tall pill on phones
    : "inset(24% 34% 24% 34% round 220px)";    // centred pill on desktop

  tl.fromTo("[data-frame]", { clipPath: startClip },
                            { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
    .fromTo("[data-frame] img", { scale: 1.5 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
    .fromTo("[data-big] span", { yPercent: 0 }, { yPercent: -40, opacity: 0, stagger: 0.03, duration: 0.6 }, 0.1)
    .to("[data-shade]", { opacity: 0.78, duration: 0.5 }, 0.6)
    .from("[data-copy] > *", { y: 80, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, 0.75)
    .from("[data-bar]", { scaleY: 0, transformOrigin: "bottom", stagger: 0.03, duration: 0.4 }, 0.95);
});
return () => mm.revert();
```
Why it works:
- **The window expands while the photo inside de-zooms (1.5 → 1).** These opposing scales are the "camera flying in" feeling. Keep both on the same ease and duration.
- **The letters leave before the window finishes**, so the word reads as the doorway you pass through.
- **The shade drops in at 60%**, darkening the now-full-bleed photo into a backdrop for the new copy, so the scene change reads as a page transition.
- `scrub: 1` adds one second of smoothing. `end: "+=220%"` gives the move about two screens of scroll, so it never feels rushed.

### 3. Requirements
- Use `clip-path: inset(... round Npx)` (GPU-friendly, animatable). Not width/height, and not a mask image.
- Ship the image at 2× the viewport and use `object-fit: cover`; the 1.5 scale must not pixelate.
- The section is exactly one viewport tall; the pin supplies the scroll length. Never let the next section overlap during the pin.
- In React, wrap the code in `useGSAP(..., { scope: root })` so selectors stay local and everything reverts on unmount.
- **Reduced motion:** skip the timeline. Show the full-bleed photo with the shade at 0.78 and the copy already visible.
- **Mobile:** use the taller pill start clip and keep `[BIG_WORD]` at 13vw so it fits on one line. Prefer ≤ 9 letters.
- Hold 60fps: animate only `clip-path`, `transform` and `opacity`. No filters on the full-screen layer.

### 4. Variations
- **Circle portal**: start from `circle(12% at 50% 50%)` and end at `circle(75% at 50% 50%)`.
- **Off-centre reveal**: start the inset from where the user clicked or hovered.
- **Video inside**: swap the `<img>` for a muted autoplay `<video>`, with the same scale tween.
- **Exit chain**: end the timeline with the next section's own zoom window, so the scenes keep "falling into" each other.

### 5. Tunable dials
| Dial | Default | Effect |
|---|---|---|
| start inset (desktop) | 24% 34% | size of the opening window |
| corner radius | 220px → 0 | pill → full-bleed |
| inner image scale | 1.5 → 1 | strength of the fly-through |
| pin length | +=220% | how long the move lasts |
| shade opacity | 0.78 | legibility of the next copy |
| letter stagger | 0.03 | how the word disperses |
