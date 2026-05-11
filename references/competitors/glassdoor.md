# Glassdoor

- **URL:** https://www.glassdoor.com
- **Category:** Major board
- **Scraped:** 2026-05-12

## UX/UI Patterns

- Homepage interlaces three core jobs-to-be-done — Find jobs, Research
  companies, Compare salaries — under a single search shell. The search
  input intelligently routes by intent (job title vs. company name vs.
  salary lookup) instead of forcing the user to pick a tab first.
- Persistent top nav surfaces the four pillars: Jobs | Companies |
  Salaries | Reviews, with Sign In and an "Employers" entry on the
  right. The "Employers" link routes to a separate B2B funnel rather
  than mixing recruiter messaging into the consumer page.
- Community-first patterns are unique vs. Indeed and LinkedIn:
  anonymous "Bowls" (group discussion threads) and verified employee
  reviews are surfaced on the home shell, treating peer voice as the
  primary trust mechanism instead of editorial badges.
- The salary calculator ("Know Your Worth") is promoted as a hero
  secondary path — it turns a one-shot anonymous visitor into a
  profile-creating user by trading personal data for a personalised
  number. Strong activation hook.
- Company pages follow a consistent template: ratings hero → review
  snippets → salary ranges → interview questions → benefits → open
  jobs. The same six-block layout repeats across millions of company
  URLs, generating massive SEO surface area on a single design system.
- After the 2023 redesign, illustrations and motion replace stock
  photography across empty states and onboarding flows, reinforcing
  the community-over-corporate positioning.

## Visual Design

- Color palette: Glassdoor green primary (~#0CAA41 / #6EBE49 range)
  used strategically for CTAs only; white and near-black (#1A1A1A)
  carry most surfaces. Expressive secondary palette added in the 2023
  refresh — pinks, oranges, yellows, purples, blues — used in
  illustrations and campaigns rather than UI chrome, so the product
  reads calm while the brand reads energetic.
- Typography: "Glassdoor Sans" — a custom geometric sans-serif by
  Giulia Boggio (Type01) with subtle quirks in letterforms. Reads
  professional but visibly warmer than Inter or LinkedIn's stack.
- Spacing / density: airy and editorial above the fold; tightens
  through review and salary modules where data density is the point.
  Card-based modules with soft corner radii (~8–12px) dominate, with
  consistent shadows giving a tactile feel.
- Hero composition: large headline + single search input + secondary
  task chips ("Salaries", "Companies", "Interviews"). Playful spot
  illustrations bracket the search field instead of photography,
  signalling "this is a safe place to be honest".
- Imagery style: flat custom illustrations of people and workplace
  scenes in the new vibrant palette — intentionally non-photoreal to
  reinforce anonymity and community over corporate polish.

## Copy & Messaging

- Hero headline: "Find a job. Find your fit."
- Subhead: "Search millions of open jobs. Research company ratings,
  reviews and salaries. Glassdoor helps you find a job you love."
- Primary CTA: "Search Jobs" (secondary: "Are you paid fairly? — Get a
  free, personalised salary estimate")
- Value-prop bullets:
  - Millions of jobs, salaries and reviews in one place
  - Trusted insights from real employees, anonymously
  - Free salary estimate compared with millions of data points
  - Active community discussions (Bowls) for honest career advice
- Tone: Encouraging, empathetic, slightly playful. Uses "your" and
  "you love" repeatedly. Frames the product around emotional fit
  ("Find your fit"), not feature lists. Avoids enterprise language;
  reads like a friend with data rather than a SaaS vendor.

## Takeaways for Hire-Bee

- Glassdoor's green-on-near-black CTA strategy is a strong reference
  for Hire-Bee: keep #2a2354 as the dominant surface and reserve a
  single saturated accent (consider a warm yellow or vibrant lime —
  not green, to avoid Glassdoor mimicry) only for the primary CTA.
  Currently Hire-Bee's role buttons compete; collapsing to one accent
  for the single most important action would sharpen the funnel.
- Adopt the "emotional fit" headline pattern. "Find a job. Find your
  fit." outperforms feature copy because it speaks to outcome. A
  Hire-Bee equivalent — e.g. "Find the role. Find the fit." — would
  be a one-line upgrade over the current minimal landing and works
  for both seeker and recruiter audiences.
- Use illustration over stock photography. Hire-Bee already owns a
  bold purple identity; a small custom illustration set (flat,
  single-accent) would carry the brand further than photography and
  avoid the LinkedIn / Indeed aesthetic. Inter pairs cleanly with
  this approach and keeps the engineering cost low.
- Borrow the community-trust angle. Hire-Bee's separate seeker and
  recruiter dashboards mean two audiences need reassurance — surfacing
  real review snippets or live counters ("X recruiters hiring this
  week", "Y new roles today") on the LandingPage borrows Glassdoor's
  authenticity play without requiring a full community product.
- Route by intent, not by role. Glassdoor's unified search infers
  what the user wants; Hire-Bee's current role-gated buttons force a
  decision before showing any value. Even a single "Get started" with
  role inference at step 2 would lower friction measurably.
