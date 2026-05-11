# Visual Design Synthesis

Compiled from 10 competitor reviews: LinkedIn, Indeed, Glassdoor, Lever, Greenhouse,
Workable, Metaview, Paradox, Eightfold, Mercor. Scraped 2026-05-12.

---

## Color palettes by category

### Major job boards

| Site | Primary | Background | Accent / CTA | Notes |
|---|---|---|---|---|
| LinkedIn | `#0A66C2` blue | White / `#F3F2EF` light gray | Gold appears only in photography | Restrained; brand blue reserved for CTAs and links |
| Indeed | `#2557A7` blue | Pure white | Same blue for links + buttons | WCAG contrast treated as a feature |
| Glassdoor | `#0CAA41` / `#6EBE49` green | White / `#1A1A1A` near-black | Expressive secondary palette (pinks, oranges, yellows, purples) used in illustrations only | CTAs green; product surfaces calm |

### ATS platforms

| Site | Primary | Background | Accent / CTA | Notes |
|---|---|---|---|---|
| Lever | `#1F4FE8` / `#3B82F6` corporate blue | White / light gray | Green for verification ticks | Minimal saturated color overall |
| Greenhouse | `#FFB81C` / `#F4A22D` marigold/orange | Off-white / deep neutrals | Marigold reserved for primary CTA only | Distinctive — only warm-primary ATS in the set |
| Workable | `#1ED760`-adjacent green | White | Pastel gradients in transition bands | Fresh; approachable rather than enterprise-austere |

### AI-native platforms

| Site | Primary | Background | Accent / CTA | Notes |
|---|---|---|---|---|
| Metaview | Near-black canvas | Dark / neutral | White type, quiet accent highlights | Color noise eliminated so product UI screenshots carry visual weight |
| Paradox | Black / white / light gray | White or near-black | Subtle blue/teal for UI chrome | Brand restraint; colors reserved for product, not chrome |
| Eightfold | Navy / dark blue | White | Accent colors for CTAs only | Enterprise-trustworthy; close cousin to Hire-Bee's `#2a2354` |
| Mercor | Off-white | White / light | Role-card accent colors provide rhythm | Brand is quiet; roles and money are the visual interest |

**Cross-cutting pattern:** Blues dominate the job-board category. Warm palettes (Greenhouse
marigold, Glassdoor secondary palette) differentiate in the ATS space. AI-native sites
trend dark or neutral with high contrast, letting product UI carry the color. No competitor
uses a saturated purple as a primary surface color — Hire-Bee's `#2a2354` is genuinely
distinctive in this market.

---

## Typography choices

| Site | Font family | Notable technique |
|---|---|---|
| LinkedIn | Source Sans / system sans-serif | Tightly tracked H1; lighter-weight subheads; bold reappears for stats |
| Indeed | Noto Sans / Helvetica fallback | Hierarchy via size over weight; no display face |
| Glassdoor | **Glassdoor Sans** (custom, by Type01 / Giulia Boggio) | Geometric sans with subtle quirks; warmer than Inter without being decorative |
| Lever | Inter or Geist-family | Strong H1/body weight contrast; minimal |
| Greenhouse | Bold sans-serif (not specified) | Italic emphasis inside H1 (`_only_`) to inject voice without a typeface change |
| Workable | Clean modern sans-serif | Tight line-height in headlines; loose in body |
| Metaview | Large sans-serif | Clarity-first; large H1, sharp hierarchy to body |
| Paradox | Near system-stack | Very legible at all sizes; no decorative display face |
| Eightfold | Large, bold sans-serif | H1 is genuinely oversized — a "hero moment," not just a label |
| Mercor | Modern sans-serif | Confident but not shouty; restrained scale |

**Key insight — Inter is the de facto standard:** Most ATS and AI-native sites converge on
Inter or an Inter-adjacent geometric sans. Glassdoor is the only site with a custom
typeface that signals material design investment. Greenhouse's italic technique (`_only_`)
shows how to add voice to Inter without a custom font — a zero-cost typographic trick.
Eightfold's oversized H1 demonstrates that scale alone can create a "hero moment" without
any supplemental imagery.

---

## Imagery: illustrations vs photos vs product screenshots

| Approach | Who uses it | When it works |
|---|---|---|
| Editorial lifestyle photography | LinkedIn, Greenhouse | Aspirational; product below the fold; hero is about feeling, not feature |
| Custom flat illustrations | Glassdoor | Reinforces anonymity and community; avoids corporate stock feel |
| Real product screenshots | Lever, Workable, Metaview | Credibility-first; pre-sells the UI to buyers already in evaluation mode |
| Animated product carousel | Metaview | Shows state transitions; visitors understand workflow, not just a static feature |
| Named real-person photography | Mercor, Paradox | Testimonials and expert stories; highest trust signal when you have placed candidates |
| Abstract geometric / orbital shapes | Metaview, Eightfold | Background depth without competing with product screenshots; works on dark canvases |
| Illustrated character figures | Eightfold | Consistent visual language across dense enterprise content |
| Essentially no imagery | Indeed | Utility positioning; search field IS the hero |

**The credibility spectrum:** Stock photography scores lowest; real product screenshots and
real named-user photos score highest. Illustration is a credibility-neutral middle path that
works well for early-stage products that cannot yet show a polished UI or real customer
photos.

---

## Spacing & density

| Site | Density character | Detail |
|---|---|---|
| Indeed | Dense below fold | Trending-link sections compress 90+ keywords above the footer |
| Glassdoor | Airy → dense | Editorial above fold; tightens in review/salary modules |
| LinkedIn | Generous then tightening | Very generous hero whitespace; density rises through product-card grid |
| Lever | Generous section rhythm | Feature cards 4-up on desktop — dense signaling capability breadth |
| Greenhouse | Generous, centered | Centered hero; mobile-responsive image swap |
| Workable | Roomy card-driven | Consistent padding; less dense than Lever; more surfaces than Greenhouse |
| Metaview | Generous → tight | Breathing room at hero; information density in feature cards below |
| Paradox | Minimalist | Large negative space around hero; increasing density into solution modules |
| Eightfold | Airy hero → dense grid | Buyers who need detail get it below; marketing wow preserved above |
| Mercor | Airy hero → dense roles | Role card grid immediately under hero is intentionally compact |

**Pattern:** Every site gives the hero room to breathe. Density increases as the visitor
scrolls deeper — social proof and feature grids are allowed to be dense because visitors
who reach them have self-selected for more detail.

---

## Dark mode prevalence

| Site | Dark mode | Notes |
|---|---|---|
| LinkedIn | No | Light-only marketing surface |
| Indeed | No | Utility positioning; WCAG on white |
| Glassdoor | No | Vibrant illustration palette needs white ground |
| Lever | No | Standard corporate light |
| Greenhouse | No | Warm marigold palette designed for light surfaces |
| Workable | No | Green + pastels need light background |
| Metaview | Dark-first | Near-black canvas is the brand; light mode is secondary |
| Paradox | Partial | Some sections use dark backgrounds for contrast; not a full system |
| Eightfold | No | Navy navy primary works on white; no explicit dark mode |
| Mercor | No | Light palette; dark text on off-white |

**Insight:** Metaview is the only site in the set that commits to a dark-first design
system. Its dark canvas is a deliberate positioning choice — it signals "AI-native,
engineering-credible" in a market of blue-and-white SaaS. Hire-Bee already ships full
dark-mode tokens and is therefore ahead of 9 of 10 competitors on this dimension.

---

## Gap analysis vs current Hire-Bee

Reference files:
- `frontend/src/styles/uiClasses.js` — `buttonClass` uses `bg-[#2a2354]` primary with
  `hover:bg-[#1f1a3d]`; `cardClass` uses `dark:bg-[#121831]` dark surface; `inputClass`
  uses `focus:border-[#5f5fff]` accent.
- `frontend/src/pages/LandingPage.jsx` — hero renders on a two-card grid; no hero imagery,
  no stat band, no illustration.

**Current Hire-Bee visual state:**
- Primary: `#2a2354` (dark purple) — unique in the market; no direct competitor match.
- Accent: `#5f5fff` (bright purple/blue) — used only on input focus states in `uiClasses.js`,
  not on CTAs.
- Font: Inter (inferred from Tailwind default and industry convention).
- Dark mode: fully tokenized in `uiClasses.js` (`dark:bg-[#121831]`, `dark:border-[#2d355c]`,
  `dark:text-[#aeb7df]`).
- Hero imagery: none — feature names rendered as plain text chips.

**Visual gaps and concrete fixes (8):**

1. **Add a warm CTA accent color.** `buttonClass` is `bg-[#2a2354]` — effectively invisible
   against a dark page background. All 10 competitors use a saturated, contrasting accent
   reserved only for the primary CTA. A warm amber (`#F5B544`) or electric lime (`#A3E635`)
   applied only to `buttonClass` would pop against both `#2a2354` and white surfaces.
   (Inspired by: Greenhouse marigold, Glassdoor green-on-near-black, LinkedIn gold-in-photo.)

2. **Activate `#5f5fff` as the CTA accent, not just the input-focus accent.** The bright
   `#5f5fff` already exists in `uiClasses.js` but is buried in `inputClass`. Elevating it
   to the primary `buttonClass` background would immediately create visual hierarchy between
   the primary CTA and secondary outline buttons — the same discipline Glassdoor and
   Greenhouse apply to their green/marigold CTAs.

3. **Add abstract geometric background shapes behind the hero.** Metaview and Eightfold both
   use orbital/gradient geometry on dark canvases to add depth without noise. On `#121831`
   (Hire-Bee's dark card background), a subtle radial gradient or floating blob SVG would
   lift the hero from flat-card to spatial without touching the color palette. Engineering
   cost: one `<div>` with a CSS gradient and `pointer-events-none`.

4. **Introduce italic emphasis in the H1.** Greenhouse's technique of italicizing one key
   word (`_only_`) in an otherwise plain Inter headline is a zero-cost typographic upgrade.
   Hire-Bee's current H1 "Run hiring from first resume to final interview." could become
   "Run hiring from first resume to *final hire*." — single italic word, immediately
   warmer, no typeface change.

5. **Use real product screenshots in the right-hand card.** Currently `LandingPage.jsx`
   renders five text chips. Lever, Workable, and Metaview all validate that a real product
   screenshot on a dark background reads as "mature product." Drop a single recruiter-
   dashboard PNG or WebP into the `${cardClass}` right card and remove the text chips.

6. **Tighten dark-mode surface contrast.** `cardClass` dark background is `#121831`; page
   background is presumably the Tailwind dark base. The border `dark:border-[#2d355c]` is
   very subtle — almost invisible on a dark canvas. Eightfold and Metaview both use
   slightly higher-contrast card borders on dark surfaces. Bumping the dark border to
   `#3d4880` would define card edges without adding visual noise.

7. **Apply the airy-hero → dense-below density pattern.** Both cards in `LandingPage.jsx`
   currently sit at the same visual weight and padding. Per every competitor: hero content
   should have more breathing room (increase `p-5` to `p-8` or `p-10` on the left hero
   card), while the feature/proof card below can be denser.

8. **Add a section eyebrow with category color.** The current `<p>` badge "Production-ready
   hiring platform" uses `border-[#cdd2ea]` — it reads as a dev status tag, not a brand
   moment. Color it with `text-[#5f5fff]` (the existing accent) or the new warm CTA color
   and reword it to a category claim ("AI-Powered Hiring Platform"). This mirrors how
   Metaview uses "Agentic Recruiting Platform" as a colored eyebrow to stake category ground.
