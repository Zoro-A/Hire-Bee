# Indeed

- **URL:** https://www.indeed.com
- **Category:** Major board
- **Scraped:** 2026-05-12

## UX/UI Patterns

- Homepage is unapologetically search-first: the first interactive
  element is a two-field search bar ("what" + "where") that consumes
  ~60% of the visible hero. No marketing carousel, no hero illustration
  competing with the input.
- Top nav is minimal — Home | Company Reviews | Sign In | Post Job
  (Employers) — separating seeker chrome from a single recruiter-side
  CTA on the far right. Strong information architecture: one nav item
  per intent.
- Single-column page flow optimized for SEO discovery: Hero search →
  "Trending Searches" (30+ keyword links) → "Trending Jobs" (30+ links)
  → "Trending Locations" (30+ links) → footer with resources / legal.
- The keyword link clouds double as both navigation and SEO surface
  area. Logged-out users land in a discovery loop; logged-in users get
  personalised recommendations slotted under the same hero shell.
- Region detection happens at the edge: indeed.com 302-redirects to
  local subdomains (e.g. pk.indeed.com) with an inline callout to
  switch back. Localization is treated as routing, not a settings
  page — fewer dropdowns to manage.
- Employer CTA ("Post Job") is text-link styled, not a button — Indeed
  protects the seeker hierarchy and lets recruiters self-identify
  rather than competing for primary attention.
- Whole page is designed to be skim-then-click. There is no scroll
  story, no narrative, no testimonial section — just inventory.

## Visual Design

- Color palette: Indeed blue primary (~#2557A7) for links, buttons and
  brand mark; pure white background; neutral grays (#595959, #767676)
  for secondary text. High WCAG contrast throughout — readability is
  treated as a feature.
- Typography: system sans-serif stack (Noto Sans / Helvetica fallback),
  modest H1 weight, no display fonts. Hierarchy is carried by size
  more than weight or color.
- Spacing / density: density rises sharply below the fold — the
  trending-link sections are deliberately compressed to fit 90+
  keyword links above the footer.
- Hero composition: centered logo, headline, search form, single CTA.
  No imagery, no illustration, no gradient — the search field IS the
  hero, and absolutely nothing distracts from it.
- Imagery style: essentially absent on the homepage. Iconography only
  (search glyph, location pin). Indeed leans on utility rather than
  aspiration, which reinforces its "public utility" positioning.

## Copy & Messaging

- Hero headline: "Your next job starts here"
- Subhead: "Create an account or sign in to see your personalised job
  recommendations."
- Primary CTA: "Get Started"
- Value-prop bullets (implicit, surfaced via section labels rather
  than marketing copy):
  - "Trending Searches" — proof through query volume
  - "Trending Jobs" — proof through inventory
  - "Trending Locations" — proof through geographic reach
- Tone: Direct, confident, second-person. Short declarative sentences.
  Avoids hype, avoids feature names, never mentions algorithms. Reads
  more like a public utility than a SaaS product — closer to a
  government services site than a Series-B startup.

## Takeaways for Hire-Bee

- Consider whether Hire-Bee's logged-out LandingPage should foreground
  a search-or-action input over role-selection buttons. Even if
  onboarding requires role choice, putting a job-keyword field in the
  hero would communicate "this is a real marketplace" instantly and
  is cheap to add against the current minimal layout.
- Borrow Indeed's "trending" link clouds as a no-cost SEO and
  social-proof pattern. A "Popular roles on Hire-Bee" or "Hiring now"
  band of clickable chips below the hero turns an empty marketing
  page into navigable inventory and earns long-tail SEO over time.
- Keep the recruiter CTA visually quieter than the seeker primary
  action — Indeed treats "Post Job" as a text link, not a button.
  Hire-Bee's twin equal-weight signup buttons currently flatten the
  hierarchy; promoting the seeker action and demoting the recruiter
  action would clarify the page's primary audience.
- Indeed's near-total absence of imagery is permission to lean
  further into Hire-Bee's typography and #2a2354 brand color. Inter
  at large sizes, generous whitespace, and a single accent for CTAs
  would feel more confident than adding illustration noise.
- Match Indeed's voice on microcopy: second-person, present-tense,
  one promise per line ("Your next job starts here"). The current
  Hire-Bee landing copy can adopt this rhythm without a redesign and
  immediately reads more like a category leader.
