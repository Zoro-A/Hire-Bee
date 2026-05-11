# Hire-Bee References

Competitor inspiration notes for UI/UX redesign decisions.

## Structure

- `_template.md` — capture template for new competitor entries
- `competitors/` — one file per scraped competitor site (raw observations)
- `synthesis/` — cross-site theme analyses with gap analysis vs current Hire-Bee

## Categories Covered

| Category | Sites |
|---|---|
| Major job boards | LinkedIn, Indeed, Glassdoor |
| ATS / recruiter tools | Lever, Greenhouse, Workable |
| AI-native hiring | Metaview, Paradox, Eightfold, Mercor |

## Usage

When designing a new screen or polishing existing UI:
1. Skim `synthesis/ui-patterns.md`, `synthesis/visual-design.md`, `synthesis/copy-messaging.md` first.
2. Drill into specific `competitors/*.md` for deeper inspiration.
3. Each synthesis file includes a "Gap analysis vs current Hire-Bee" section to find quick wins.

## Current Hire-Bee Brand

- Primary: `#2a2354` (dark purple)
- Accent: `#5f5fff`
- Font: Inter
- Dark mode: full token coverage
- Landing: `frontend/src/pages/LandingPage.jsx`
- Marketing wrapper: `frontend/src/components/layout/MarketingLayout.jsx`
- Shared UI classes: `frontend/src/styles/uiClasses.js`
