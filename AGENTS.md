
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
