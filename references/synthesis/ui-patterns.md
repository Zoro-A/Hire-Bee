# UI/UX Patterns Across Competitors

Compiled from 10 competitor reviews: LinkedIn, Indeed, Glassdoor, Lever, Greenhouse,
Workable, Metaview, Paradox, Eightfold, Mercor. Scraped 2026-05-12.

---

## Navigation patterns

| Site | Nav depth | Primary CTA in nav | Notable structure |
|---|---|---|---|
| LinkedIn | Shallow (4 categories) | "Chat with sales" + "Post a job" | Locale picker foregrounded; Compare Products is first-class |
| Indeed | Minimal (3 items) | "Post Job" (text-link, not button) | Strict seeker-first hierarchy; employer buried far right |
| Glassdoor | 4 pillars | "Employers" routes to separate B2B funnel | Separates consumer and recruiter destinations at nav level |
| Lever | Narrow (4 items) | "Request Demo" + "Pricing" | Pricing always visible in nav; comparison sub-pages |
| Greenhouse | Mega-menu (5 buckets) | "Request demo" (right-aligned) | "Why Greenhouse" bucket exposes Compare, ROI, Awards |
| Workable | Persistent dual-CTA | "Request a demo" + "Start a free trial" | Self-serve and sales paths treated as equals |
| Metaview | Short (5 items) | "Start free" + "Book demo" | Three auth entry points: Sign in / Book demo / Start free |
| Paradox | Heavy mega-menu | "Demo" | Audience segmentation: Enterprise / Mid-Market / Franchise |
| Eightfold | Segmented (7 buckets) | "Request demo" | "Learn" and "Events" are top-level — content-marketing GTM |
| Mercor | Extremely lean (5 items) | "Login" only | Nav doubles as positioning; "APEX" sub-items signal product |

**Cross-cutting pattern:** Every site that targets enterprise buyers (Greenhouse, Paradox,
Eightfold) uses a mega-menu with audience-segmented sub-routes. Every site that targets
self-serve (Metaview, Mercor, Workable) uses a lean nav with dual auth CTAs pinned right.
LinkedIn and Glassdoor keep the B2B funnel in a separate subdomain or right-rail link so
consumer traffic is not disrupted.

---

## Hero compositions

Six distinct hero archetypes observed across the 10 sites:

1. **Search-first** (Indeed, Glassdoor): The search input IS the hero. No competing visual.
   Centering, white space, zero illustration above the field. Works when inventory is the
   value prop. Glassdoor adds task-chips ("Salaries", "Interviews") as secondary paths.

2. **Screenshot-forward / product-first** (Lever, Workable, Metaview): A real product
   dashboard sits adjacent to or behind the headline stack. Credibility comes from showing
   the UI before asking for trust. Lever uses a video background of the candidate pipeline;
   Metaview uses a four-state carousel cycling through agent surfaces.

3. **Headline + photography** (LinkedIn, Greenhouse): Editorial lifestyle or candid office
   photography balances the headline. Product screenshots sit below the fold. Aspirational
   before it is functional. Greenhouse centers both CTA and image stack; LinkedIn goes
   left-aligned headline vs. right-aligned portrait.

4. **Named character / spokesperson** (Paradox): "Olivia" appears in the hero shot and
   is named in copy. Humanizes AI; gives sales a recurring artifact. Mascot/character
   approach unique to this set.

5. **Provocative question** (Eightfold): "How do you run 1 million interviews in 1 hour?"
   — curiosity gap over category label. Subhead explains the mechanism. Single forward-arrow
   CTA. Works best when the capability itself is jaw-dropping.

6. **Inventory-under-hero** (Mercor): Left-aligned minimal headline + dual CTAs, then an
   immediate live grid of 10 role cards with actual salaries. The inventory IS the social
   proof. Closest to a marketplace pattern rather than SaaS.

**Dual-CTA prevalence:** 7 of 10 sites lead with two hero CTAs. The primary is usually
demo/trial/start; the secondary is pricing/learn/tour. Only Indeed and Eightfold use a
single dominant CTA. Role-based entry (Seeker vs. Recruiter) is used by none of the 10 as
the primary split — all 10 defer role selection to step 2 or later.

---

## Dashboard / list patterns

Observations from ATS and AI-native sites that expose recruiter-side UI:

- **Lever**: Candidate cards show fit scores, pipeline stage, avatar, and one-line note.
  Side-by-side layout on desktop; each card is actionable with inline buttons. Timeline
  view for pipeline progress lives in a separate expandable panel.
- **Workable**: Alternating image/text feature blocks, each anchored by a workflow diagram
  or screenshot. Card module micro-pattern: eyebrow label → single-line headline →
  2-3 line copy → screenshot → inline "learn more" link. Repeats 6+ times without
  feeling monotonous because spacing is generous.
- **Greenhouse**: Role-based "MyGreenhouse" dashboard treated as a named, marketable
  surface. Company pages follow a rigid 6-block template (ratings → reviews → salaries →
  interview questions → benefits → open roles) repeated at scale — one design system,
  millions of pages.
- **Metaview**: Four agent-surface cards ("Sourcing", "Application Review", "Notes",
  "Reports") in the marketing hero carousel. Each card is verb-first. The carousel
  implies state transitions — visitors understand they are seeing a workflow, not a feature
  list.
- **Paradox**: 11 expandable solution modules (accordion pattern) for enterprise depth
  without infinite scroll. Visitor self-selects which module to expand; others stay
  collapsed.
- **Eightfold**: Capability cards in a dense grid below the airy hero. Illustrated human
  figures recur as consistent visual language across otherwise dense content.

---

## Trust & social proof patterns

| Pattern | Who uses it | Detail |
|---|---|---|
| Logo carousel (20+ brands) | Paradox, Greenhouse, Eightfold | Rotates; filters audience implicitly |
| Single bold stat | Workable, LinkedIn | "30,000+ companies" / "24% less likely to reopen" |
| Industry-strip (verticals, not logos) | Lever | Useful when individual logo permissions are limited |
| Named testimonials with job titles | Lever | Humanizes social proof more than nameless quotes |
| Cinematic full-bleed testimonial photo | Greenhouse | Single customer, full viewport width |
| Video testimonials with play buttons | Paradox | Repeated throughout the page |
| Community reviews + salary data | Glassdoor | Peer voice as primary trust mechanism |
| G2 / analyst rating badges | Metaview, Eightfold | Last-mile reassurance placed just before the CTA |
| Real photos of named users | Mercor | "Jay", "Mick", "Michael" — actual placed candidates |

**Cross-cutting insight:** Logo walls require permission and relationships. Early-stage
platforms (Lever, Workable in early days) substitute with industry-vertical strips, single
large stats, or named individual testimonials. G2/Gartner badges are obtainable once a
product has reviews and provide disproportionate enterprise trust lift.

---

## CTA & conversion patterns

| Site | Primary CTA | Secondary CTA | Pattern |
|---|---|---|---|
| LinkedIn | "Contact sales" | "Post a job" | Enterprise + SMB dual funnel |
| Indeed | "Get Started" | — | Single CTA; role implied by page |
| Glassdoor | "Search Jobs" | Salary estimate | Task-based; secondary is activation hook |
| Lever | "Get a Demo" | "See Pricing" | Demo + transparent pricing |
| Greenhouse | "Explore platform" | "Request a demo" | Product tour before commitment |
| Workable | "Request a demo" | "Start a free trial" | Equal-weight self-serve vs. sales |
| Metaview | "Start for free" | "Book a demo" | Self-serve first; enterprise second |
| Paradox | "Request demo" | — | Single CTA; heavy enterprise |
| Eightfold | "Try AI Interviewer now →" | — | Single action-verb CTA with arrow |
| Mercor | "Start working" | "Learn more" | Marketplace framing |

**Patterns:** "Demo" dominates B2B/ATS sites. "Free" or "Start" dominates AI-native and
marketplace sites. Role-split buttons (Seeker / Recruiter) appear on none of the 10.
Pre-footer CTA repetition is used by Workable and Lever to recover scroll-past visitors.
FAQ sections appear inline on Lever and Metaview — objection-handling without routing the
user to a help center.

---

## Gap analysis vs current Hire-Bee

Reference files: `frontend/src/pages/LandingPage.jsx`, `frontend/src/components/layout/MarketingLayout.jsx`

**Current state:**
- `LandingPage.jsx` hero H1: "Run hiring from first resume to final interview."
- Three equal-weight role buttons: "Continue as Job Seeker" / "Continue as Recruiter" / "Continue as Admin".
- Right-hand card lists 5 feature names as plain text chips.
- `MarketingLayout.jsx` nav: logo + theme toggle + "Login" text link + "Get Started" button. No product navigation, no comparison link, no secondary CTA.

**Quick wins (7):**

1. **Collapse role buttons to one primary CTA.** All 10 competitors defer role selection to
   step 2. Replace the three equal-weight links with a single "Get Started" primary button
   (already styled as `buttonClass` in `uiClasses.js`) and move role selection to the
   register page. The "Admin" link especially signals internal tooling, not a marketing
   product. (Inspired by: LinkedIn's funnel separation, Indeed's single CTA.)

2. **Add a social proof stat band below the hero.** A single `<div>` on a contrasting
   background between the hero card and the feature card. Even one metric — "X resumes
   parsed" or "Y interviews scheduled" — does heavy persuasion work. LinkedIn's 24% stat
   and Workable's "30,000+ companies" both show that one number beats a feature list.

3. **Replace the feature-chip list with a product screenshot.** `LandingPage.jsx` renders
   feature names as plain text. Lever, Workable, and Metaview all show real product UI in
   the hero. Hire-Bee has a recruiter dashboard — a screenshot of it on the right card
   would immediately communicate product reality.

4. **Add a pre-footer CTA band in `MarketingLayout.jsx`.** Workable and Lever both repeat
   the hero CTAs in a contrasting gradient band above the footer. The layout shell is the
   right place to inject this once so it appears on every marketing page.

5. **Surface a "Why Hire-Bee" or "How it works" link in the nav.** `MarketingLayout.jsx`
   has only logo + theme toggle + Login + Get Started. Greenhouse's "Why Greenhouse"
   submenu and Lever's "Compare" nav slot both funnel evaluating buyers without cluttering
   the hero. A single text link costs one line of JSX.

6. **Add an eyebrow label above the H1.** The current badge "Production-ready hiring
   platform" is rendered in an inline `<p>` with border. Framing it as a category claim
   (e.g., "AI-Powered Hiring") rather than a dev status label ("Production-ready") turns
   an internal note into a marketing asset. Metaview's "Agentic Recruiting Platform" eyebrow
   follows this pattern.

7. **Separate seeker and recruiter messaging into distinct scroll sections.** Currently
   both audiences read the same three-button block. Paradox segments by audience type
   explicitly; Mercor separates "experts" and "enterprise" at the nav level. A two-section
   hero — seeker above the fold, recruiter below — would let each audience see copy written
   for them without a full redesign of the current two-card grid layout.
