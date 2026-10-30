# Master Prompt — WebGL Liquid Distortion Hero

**Also known as:** RGB-shift ripple hero · chromatic-aberration displacement shader · liquid image distortion, with a noise-edge veil reveal and a SplitText 3D character rise.
**Stack:** three.js (one full-screen `ShaderMaterial` quad) + GSAP (timeline, ScrollTrigger, SplitText) + any framework (React/Next.js shown).
**Reference build:** Don Corte Fino, `src/components/motion/HeroGL.tsx` + `HeroSection` in `src/components/landing/Sections.tsx`.

Copy everything below the line into your AI coding tool and fill in the `[BRACKETS]`.

---

## PROMPT

Build a full-viewport hero section for **[BRAND]** that plays a cinematic "WebGL Liquid Distortion" intro, then stays alive while the user moves the pointer and scrolls. The page should feel like a luxury editorial site (Awwwards-level), not a template.

### 1. Layers (back to front)
1. **WebGL canvas** covering the section (`position:absolute; inset:0`). It renders one photo, `[HERO_IMAGE_URL]`, through a custom fragment shader.
2. **Static `<img>` fallback** of the same photo under the canvas. Fade it out (`opacity:0`) once the texture has loaded. Keep it visible when WebGL is unavailable or the user prefers reduced motion.
3. **Two gradient overlays** for legibility: bottom-to-top `[DARK]`→transparent, and left-to-right `[DARK]/80%`→transparent across the left 2/3.
4. **Content block**, bottom-left, max-width ~1500px. Keep text to a minimum:
   - kicker label (small caps, wide tracking, champagne/gold tone): `[KICKER]`
   - giant display headline (≈13vw mobile, ≈7.6vw desktop, line-height 0.92), second half in the accent colour: `[HEADLINE_PART_1] <span accent>[HEADLINE_PART_2]</span>`
   - thin gold rule underneath
   - **one** primary CTA button: `[CTA_LABEL]` → `[CTA_HREF]`
5. **Scroll cue**: a 22×40px rounded mouse outline with a 2px dot bouncing inside, centred at the bottom (desktop only).

### 2. The shader (fragment) — do all of these
Uniforms: `uTex, uRes (canvas px), uImg (image px), uMouse (0–1), uTime, uVel (0–1 pointer speed), uScroll (0–1), uIntro (0→1)`.

1. **Cover-fit UVs**: crop the texture like CSS `object-fit: cover`, using `uRes` and `uImg`.
2. **Liquid drift**: two 2D simplex-noise fields at a scale of about 2.2, scrolling slowly in opposite directions (speed about 0.05). Offset the UVs by `vec2(n1, n2) * 0.006`, so the photo never sits completely still.
3. **Pointer lens + ripple** (aspect-corrected distance `d` to `uMouse`):
   - `lens = smoothstep(0.32, 0.0, d)`
   - ripple: `normalize(toMouse) * sin(d*38 - uTime*3.5) * 0.01 * lens * (0.25 + uVel)`
   - bulge: `-toMouse * lens * 0.06`
4. **Zoom**: `zoom = 1 - 0.12*uScroll + 0.18*(1 - uIntro)`. The image starts zoomed out and settles on intro, then pushes in as you scroll.
5. **Chromatic aberration (RGB split)**: sample R, G and B separately, offset along the pointer direction by `0.002 + 0.012*uVel + 0.01*uScroll`.
6. **Colour grade**: warm the mids (`col * vec3(1.08, 0.86, 0.88)`, mixed at 35%) and push the shadows toward `[ACCENT_DARK_RGB]` (for example burgundy `0.38,0.13,0.18`). Add a vignette centred at about `(0.55, 0.5)`, and darken further as `uScroll` rises (`col *= 0.78 - 0.35*uScroll`).
7. **Noise-edge veil reveal** (the intro): build a diagonal edge with `st.x*0.6 + (1-st.y)*0.4 + snoise(st*4 + uTime*0.2)*0.08`. Wherever `edge` is above the moving threshold `uIntro*1.4 - 0.05`, show a solid `[ACCENT_DARK]` veil. Tweening `uIntro` from 0 to 1 peels the veil away along an organic, living edge.

### 3. JavaScript behaviour
- Create the renderer with `antialias:false`, `powerPreference:"high-performance"` and `pixelRatio = min(devicePixelRatio, 1.75)`. Wrap it in try/catch; on failure, leave the fallback `<img>` in place.
- Render an orthographic camera and a 2×2 plane (`gl_Position = vec4(position.xy, 0, 1)`).
- **Pointer**: listen on `window`. Keep a target position and lerp `uMouse` toward it at 0.08 per frame. Velocity is pixels per millisecond: add `v*0.08` to `uVel`, clamp it to 1, and decay it by ×0.94 every frame.
- **Scroll**: a ScrollTrigger from `top top` to `bottom top` with `scrub:true` writes `progress` into `uScroll`.
- **Loop**: drive frames with `gsap.ticker`. Pause rendering when the section is off-screen (IntersectionObserver).
- **Resize**: use a ResizeObserver to update the renderer size and `uRes`.
- **Intro trigger**: start the intro only after the page preloader finishes (dispatch a custom `site:loaded` event and set a `window.__loaded` flag). Then run `gsap.to(uIntro, {value:1, duration:2.6, ease:"power3.inOut"})`.
- **Cleanup**: dispose the texture, geometry, material and renderer; remove the listeners and kill the triggers.

### 4. Headline choreography (GSAP)
Split the headline with `SplitText.create(h1, { type:"lines,chars", mask:"lines" })` and give the h1 `perspective:600px`. Build a paused timeline that plays on the same `site:loaded` event:
1. chars: `from { yPercent:115, rotateX:-70, transformOrigin:"50% 100%" }`, stagger 0.028, duration 1.5, ease `expo.out`
2. `[data-hero-fade]` elements (kicker, CTA, scroll cue): `from { y:40, autoAlpha:0 }`, stagger 0.12, duration 1.3, starting at "-=1.1"
3. gold rule: `from { scaleX:0, transformOrigin:"left" }`, duration 1.6, ease `expo.inOut`, at "<"

On scroll, the content block moves `yPercent:-35` and fades to 0 between `top top` and `bottom 20%` (scrub).

### 5. Optional preloader (pairs with the veil)
A full-screen `[DARK]` panel. The logo SVG strokes draw in (`strokeDashoffset 600→0`, 1.6s), the brand letters rise (`yPercent 120→0`, stagger 0.035), and a 000→100 counter runs in the corner. Then an `[ACCENT]` curtain wipes up (`yPercent -100`, `expo.inOut`, 1.1s) and the panel follows 0.15s later. Fire `site:loaded` when it completes. Show it once per session (sessionStorage).

### 6. Accessibility & quality bar
- With `prefers-reduced-motion: reduce`: no WebGL, no SplitText, static photo and text.
- Hold 60fps on a mid-range laptop and stay smooth on mobile (no pointer effects needed there).
- No layout shift: the section is `height:100svh; min-height:640px; overflow:hidden`.
- Text contrast must stay AA over the darkest and the brightest areas of the photo. Tune the overlays until it does.
- Deliver as one self-contained component, with the hero image and copy passed in as props.

### 7. Tunable dials (expose as constants)
| Dial | Default | Effect |
|---|---|---|
| drift amplitude | 0.006 | how "liquid" the idle image feels |
| lens radius | 0.32 | size of the pointer magnifier |
| ripple frequency / speed | 38 / 3.5 | ring density / speed |
| RGB split max | 0.012 + 0.01 | chromatic intensity |
| intro duration | 2.6s | veil peel speed |
| scroll push-in | 0.12 | zoom while scrolling out |
