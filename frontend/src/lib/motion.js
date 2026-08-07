/** Custom easings — never the browser default CSS eases. */
export const EASE = {
  out: "expo.out",
  inOut: "power4.inOut",
  soft: "power2.out",
  /** CSS-side equivalents, mirrors --ease-out-expo in index.css */
  cssOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  cssInOut: "cubic-bezier(0.76, 0, 0.24, 1)",
}

/** Durations in seconds (GSAP units). UI micro-interactions stay 0.1–0.3s. */
export const DUR = {
  micro: 0.14,
  fast: 0.22,
  base: 0.32,
  slow: 0.6,
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
