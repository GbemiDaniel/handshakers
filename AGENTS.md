
# Antigravity IDE UI/UX Rule System v2.0
## Target Environment: Frontend Web Architecture

### 1. Motion and Micro-Interactions
- **Timing & Curves:** Enforce a strict 200ms–300ms window for interactive components. Standardize on `cubic-bezier(0.4, 0, 0.2, 1)` over rigid `linear` presets.
- **Render Optimization:** Animate only `transform` (scale, translate, rotate) and `opacity`. Strictly avoid animating height, width, top, or margin properties to save Antigravity’s Browser Agent from layout-thrashing performance bottlenecks.
- **Accessibility Safeguard:** Always generate a `prefers-reduced-motion` media block to bypass animations gracefully for users with vestibular sensitivities.

### 2. Responsive Container & Typography Scaling
- **Fluid Sizing:** Utilize modern CSS mathematical formulas like `clamp()`, `min()`, or `max()` for font sizes and primary padded areas. Do not hardcode static pixel values.
- **Modular Adaptability:** Favor container queries (`@container`) over general media queries (`@media`) for modular blocks.
- **Intrinsic Defense:** Every generated box model must feature fail-safes against text-overflow. Explicitly use `min-width: 0` on flex items, and flexbox wrappers with `flex-wrap: wrap`.

### 3. Agent Interactive States
- **Background Layer Visibility:** Use transparent micro-spinners, skeleton loaders, and glowing border pulses when async background tasks run.
- **Override Control States:** Mount visible execution controls—such as `Pause`, `Cancel`, or `Human Override` actions—directly bound to lifecycle state engines.
- **Graceful Error Handling:** Provide clear fallback states with descriptive warnings rather than silently breaking or freezing.

---

# UI Engineering Directive: Performance-First Motion

When instructed to generate frontend UI code involving animations, parallax, or scroll-linked motion in React/Next.js environments, you must act as a strict Performance Engineer. Adhere to the following architectural rules:

1. **PROTECT THE MAIN THREAD:**
Never use continuous event listeners (e.g., `window.addEventListener('scroll')` or `onMouseMove`) that directly mutate the DOM or trigger layout recalculations (`top`, `left`, `margin`, `width`).

2. **GPU COMPOSITING ONLY:**
All motion must be restricted to CSS Composite properties: `transform` (translate, scale, rotate) and `opacity`. Use `will-change-transform` on elements that will animate to ensure they are promoted to their own GPU layer before the animation begins.

3. **HARDWARE-ACCELERATED LIBRARIES:**
Default to Framer Motion. Use `useScroll` for scroll-linked animations and `useMotionValue` / `useTransform` for pointer-linked animations. Map scroll/pointer progress to transform values dynamically.

4. **THE 3D CONTEXT:**
If applying `rotateX`, `rotateY`, or `translateZ`, you MUST apply a CSS `perspective` value to the parent container. Otherwise, the 3D math will fail to render depth.

5. **MOBILE DEGRADATION (ENVIRONMENTAL AWARENESS):**
Never assume a pointer exists. You must explicitly check for hardware capabilities using `window.matchMedia('(hover: hover) and (pointer: fine)')`.
- If true: Mount pointer-based event listeners.
- If false: Mount touch-friendly fallbacks (e.g., `whileInView` intersection observers) and keep pointer-tracking logic unmounted to save battery and CPU.

6. **PHYSICS EFFICIENCY:**
Do not wrap continuous raw inputs (like mouse position for background tracking) in Spring physics unless tactile momentum is specifically requested (like a card tilt). Reserve `useSpring` for localized interactions to avoid CPU overhead.
