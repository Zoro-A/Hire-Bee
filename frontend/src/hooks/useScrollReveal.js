import { gsap, useGSAP } from "@/lib/gsap"
import { DUR, EASE, REDUCED_MOTION_QUERY } from "@/lib/motion"

/**
 * Staggered scroll-reveal for a list of children inside `scopeRef`.
 * Animates transform + opacity only. No-ops (elements shown at rest) under
 * prefers-reduced-motion.
 *
 * @param {import("react").RefObject<HTMLElement>} scopeRef
 * @param {{selector?: string, y?: number, stagger?: number, start?: string}} [opts]
 */
export function useScrollReveal(scopeRef, opts = {}) {
  const { selector = "[data-reveal]", y = 16, stagger = 0.06, start = "top 88%" } = opts

  useGSAP(
    () => {
      const targets = gsap.utils.toArray(selector)
      if (targets.length === 0) return

      const mm = gsap.matchMedia()

      mm.add(`(prefers-reduced-motion: no-preference)`, () => {
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: DUR.base,
          ease: EASE.out,
          stagger,
          scrollTrigger: { trigger: scopeRef.current, start, once: true },
        })
      })

      mm.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: "transform" })
      })

      return () => mm.revert()
    },
    { scope: scopeRef, dependencies: [selector, y, stagger, start] },
  )
}
