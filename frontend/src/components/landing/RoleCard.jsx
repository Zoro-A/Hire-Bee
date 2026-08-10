import { Link } from "react-router-dom"
import { PiCheck } from "react-icons/pi"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// CSS-only "focus card" interaction: hovering/focusing any card in the
// `group/picker` blurs its siblings; the active card stays crisp. No JS,
// no motion library — see Task 4.1 brief for why this is hand-built.
const FOCUS_CLASSES =
  "transition-[filter,transform,border-color] duration-200 ease-[var(--ease-out-expo)] " +
  "group-hover/picker:blur-[1.5px] group-hover/picker:opacity-70 " +
  "hover:!blur-0 hover:!opacity-100 hover:-translate-y-0.5 hover:border-brand/50 active:scale-[0.97] " +
  "focus-within:!blur-0 focus-within:!opacity-100 " +
  "motion-reduce:!blur-0 motion-reduce:!transform-none"

export function RoleCard({ id, eyebrow, headline, description, perks, cta, Icon, featured = false, className }) {
  const visiblePerks = featured ? perks : perks.slice(0, 2)

  return (
    <Link
      to={`/register?role=${id}`}
      data-reveal-role
      className={cn(
        "group relative flex flex-col rounded-2xl border border-surface-border bg-surface-raised opacity-0",
        FOCUS_CLASSES,
        featured ? "justify-between p-7" : "justify-center gap-1 p-5",
        className,
      )}
    >
      <div>
        <span
          className={cn(
            "mb-4 inline-flex items-center justify-center rounded-xl",
            featured ? "h-12 w-12 bg-brand-soft text-brand-on-soft" : "h-10 w-10 bg-surface-subtle text-ink-muted",
          )}
        >
          <Icon className={featured ? "size-6" : "size-5"} aria-hidden="true" />
        </span>
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-ink-faint">
          {eyebrow}
        </p>
        {/* h3: nested under the "Choose how you'll use HireBee" <h2> in LandingPage.jsx */}
        <h3 className={cn("font-display font-bold text-ink", featured ? "mb-2 text-2xl" : "mb-1.5 text-base")}>
          {headline}
        </h3>
        <p className={cn("text-ink-muted", featured ? "mb-5 text-sm leading-relaxed" : "mb-3 text-xs leading-relaxed")}>
          {description}
        </p>
        <ul className={cn("space-y-1.5", featured ? "mb-6" : "mb-4")}>
          {visiblePerks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-xs text-ink-muted">
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full", featured ? "bg-brand-soft text-brand-on-soft" : "bg-surface-subtle text-ink-muted")}>
                <PiCheck className="size-2.5" aria-hidden="true" />
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </div>
      <Button asChild variant={featured ? "default" : "outline"} className="pointer-events-none w-full">
        <span>
          {cta} <span aria-hidden="true">&rarr;</span>
        </span>
      </Button>
    </Link>
  )
}
