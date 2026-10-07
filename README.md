# foodplanning

A social-dining planner for figuring out where to eat with friends, built with
Next.js App Router, React, TypeScript, Tailwind CSS, and ESLint.

## Local setup

Requires Node.js 24 LTS and npm.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3000. No API key is needed for social dining.

## Planning an outing

One organizer enters a public area and preferences for 2-8 people:
cuisine favorites, cuisines to skip, a comfortable price range, dietary needs,
and optional notes such as outdoor seating.

The app excludes any cuisine skipped by anyone, ranks the remaining cuisines
by number of favorites, and offers up to three Google Maps search links.
Ties follow the cuisine order in the form; when nobody has favorites, these
are exploration ideas, not consensus recommendations. If every cuisine is
skipped, the app asks the group to revisit their preferences.

The lowest selected price range informs the search wording. Dietary needs
and notes appear in a checklist, not automatic restaurant filters. Maps
results are not verified for budget, dietary suitability, availability,
distance, or group seating. Confirm prices, hours, seating, and dietary needs
directly with the restaurant.

This version does not fetch actual restaurant listings or include voting on
venues, accounts, invite links, or saved profiles. Opening a Maps link shows
Google's current search results for the selected cuisine and area.

## Planned feature spaces

The page's **Coming next** section reserves visible, non-interactive UI spaces
for requirements 2-10: taste profiles through swiping or ratings; dietary
restrictions and allergies; participant locations or a meeting area; live
open-now restaurant retrieval within a configurable distance; restaurant
recommendations and explanations; group voting; final decision methods; and
sharing the chosen restaurant's details and directions.

Each card is labeled **Planned** and distinguishes existing behavior from work
still needed. No placeholder collects data, casts votes, selects a restaurant,
or claims verified restaurant or allergy information. Live venue features need
a restaurant data provider, and independent group participation needs shared
storage and participant identification.

## Checks

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The tests use Node's built-in test runner and do not make paid AI calls.
To serve a production build locally, run `npm.cmd start`.
Development and production builds use webpack with Tailwind's PostCSS plugin
because the default Turbopack build crashed on the initial Windows setup.

The initial dependency audit reports five high-severity advisories through
`braces` in the ESLint development dependency chain. npm's proposed forced fix
downgrades the Next.js ESLint config across major versions, so it is not applied.
Track upstream fixes and rerun `npm.cmd audit` when updating dependencies.

## Project structure

- `src/app/page.tsx`: social-dining form, group summary, and Maps search links.
- `src/app/components/planned-features.tsx`: labeled feature spaces for requirements 2-10.
- `src/lib/social-dining.ts`: dining types, validation, ranking, and search links.
- `src/app/api/meal-plan/route.ts`: legacy server-only AI cooking endpoint.
- `src/lib/meal-plan.ts`: legacy cooking types, validation, and output schema.
- `tests/`: social-dining and legacy meal-plan validation tests.

## Social-dining privacy

Preferences stay in browser memory and clear on refresh. Names are not
requested. Avoid personal or medical information and use a neighborhood or
city rather than a private address. No AI calls are made by the social-dining
flow. Opening a Maps link sends only the area, cuisine, and price-range wording
to Google; dietary needs and individual notes are not included.

## Legacy AI endpoint and deployment

The earlier cooking endpoint remains available for compatibility but is not
used by the social-dining UI. To enable it locally, copy `.env.example` to
`.env.local`, set `OPENAI_API_KEY`, and opt into paid calls with
`ENABLE_AI_PLANNING=true`. Optionally set `OPENAI_MODEL` to a model supporting
Responses API structured outputs. Restart the server after environment changes.
Never use a `NEXT_PUBLIC_` variable for an API key.

Calling this endpoint with AI enabled sends preferences and serving counts to
OpenAI. Group preferences are labeled by person number.
Do not enter sensitive personal or medical information. Responses are requested
with `store: false`; this is not a guarantee of zero provider retention. Review
the provider's data policies before use.

AI output is not authoritative: verify allergens, ingredient amounts, and safe
cooking instructions. This application is not medical or nutritional advice.
Plans are held in browser memory only and are cleared on refresh.

**This is a local-development starter, not a public production AI service.**
Keep `ENABLE_AI_PLANNING=false` on public deployments until authentication,
per-user rate limits, abuse prevention, and spending controls are implemented.
The flag is a deployment switch, not an authorization mechanism. The route
validates inputs and outputs, times out provider requests, and reports errors,
but does not yet implement accounts, saved plans, or a database.

## GitHub

Intended remote: https://github.com/Megmelloy/foodplanning.git.
Keep this project separate from other repositories; do not replace their remotes.
