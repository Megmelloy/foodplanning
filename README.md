# foodplanning

A starting point for AI-assisted food planning, built with Next.js App Router,
React, TypeScript, Tailwind CSS, and ESLint.

## Local setup

Requires Node.js 24 LTS and npm.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
```

Edit `.env.local`: set `OPENAI_API_KEY` to your own key and
`ENABLE_AI_PLANNING=true` to opt in to paid AI calls locally. Optionally change
`OPENAI_MODEL` to a model that supports Responses API structured outputs.
Never use a `NEXT_PUBLIC_` variable for an API key. Environment files are ignored
by Git except the placeholder `.env.example`.

```powershell
npm.cmd run dev
```

Open http://localhost:3000. Choose 1-7 dinners, 1-8 servings, and optional
preferences. For group planning, one organizer can enter preferences for 2-8
people; their profiles are labeled by person number and are not shared by link.
Plans include dinner ingredients, instructions, and a combined grocery list.
Without configuration, the UI shows a clear setup error rather than making up
a plan. Restart the server after environment changes.

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

- `src/app/page.tsx`: responsive food-planning form and results.
- `src/app/api/meal-plan/route.ts`: server-only OpenAI Responses API integration.
- `src/lib/meal-plan.ts`: shared types, validation, and structured-output schema.
- `tests/`: input and generated-plan validation tests.

## AI privacy and deployment

Submitting the form with AI enabled sends preferences and serving counts to
OpenAI. Group preferences are labeled by person number; names are not requested.
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
