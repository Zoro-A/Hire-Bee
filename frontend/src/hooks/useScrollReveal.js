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
        gsap.fromTo(
          targets,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration: DUR.base,
            ease: EASE.out,
            stagger,
            clearProps: "opacity",
            scrollTrigger: { trigger: scopeRef.current, start, once: true },
            // Targets also carry a Tailwind `opacity-0` class (FOUC guard for the
            // pre-JS moment). That class is static JSX and React never removes it,
            // so once `clearProps` drops the inline opacity GSAP was holding at 1,
            // the class would fall straight back to opacity:0 and re-hide the
            // element. Strip it once the reveal is done so the browser default
            // (opacity:1) applies instead, and CSS-only interactions that toggle
            // opacity via a plain (non-!important) class — e.g. RoleCard's
            // group-hover/picker dim-siblings effect — can take over normally.
            onComplete: () => targets.forEach((el) => el.classList.remove("opacity-0")),
          },
        )
      })

      mm.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: "transform" })
      })

      return () => mm.revert()
    },
    { scope: scopeRef, dependencies: [selector, y, stagger, start] },
  )
}
