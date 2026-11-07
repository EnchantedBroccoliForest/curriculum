# AI curriculum tracker

A personal, static site for a one-year AI study programme: 49 active weeks (CS primer P1–P5, then weeks 1–44) plus
3 unassigned buffer weeks at 6 hours a week. It tracks weeks, hours, the six closed-book derivations, papers,
the 12-row competency ledger, checkpoint artifacts and the weekly log, and gives an expanded page for every week.
One user, no accounts, no server.

The canonical plan lives in the Claude document "AI Curriculum — One-Year Plan". Two Markdown tabs exported from it
are the only inputs: `content/source/Curriculum.md` and `content/source/Lesson plan and log.md`. The parser turns
them into `content/curriculum.json`; the UI never hardcodes curriculum text.

## Run

```bash
pnpm install
pnpm dev
```

Other scripts:

| Command | What it does |
| --- | --- |
| `pnpm build` | Static build into `dist/` (also writes `dist/404.html` for GitHub Pages deep links) |
| `pnpm preview` | Serve `dist/` locally |
| `pnpm typecheck` | Type-check the app and the scripts |
| `pnpm parse` | Re-run the parser: writes `content/curriculum.json`, `content/PARSE_NOTES.md`, and skeletons for missing week files |
| `pnpm resync` | Parser plus regeneration of only the week files whose source row changed |
| `pnpm check` | Validate every week file (frontmatter hash, sections, line limits, no URLs outside the sources) |
| `node scripts/e2e.mjs` | Browser acceptance checks against `dist/` (needs Playwright + Chromium) |

## Deploy

Static output in `dist/`; any static host works.

- **Vercel:** `vercel deploy --prod` from the repo root (framework preset: Vite; output `dist`). Add a rewrite of all
  paths to `/index.html` for deep links, or rely on the default SPA handling.
- **GitHub Pages (project site):** `VITE_BASE=/<repo>/ pnpm build`, then publish `dist/` (for example
  `npx gh-pages -d dist`). `dist/404.html` makes deep links such as `/week/17` resolve.
- **GitHub Pages (user site or custom domain at the root):** `pnpm build` and publish `dist/`.

The site works offline after the first load (a small service worker caches the site's own assets). No analytics; no
third-party fonts or scripts at runtime. KaTeX fonts are bundled.

## Progress: where it lives, export and import

All progress is in `localStorage` under one versioned key (`ai-curriculum-progress:v1`). **Settings** has:

- **Export JSON**: downloads the full progress object.
- **Import JSON**: replaces the stored progress with a file you choose.
- **Load progress.json from the site**: loads `progress.json` served next to the site.
- **Reset** (with an inline confirmation).

To commit your progress, export it and save it as `public/progress.json`. On a browser with no stored progress the
site loads that file as the default, so a fresh device starts where the committed file left off.

Progress is keyed by stable ids (week ids `P1`…`44`, derivation, competency, checkpoint and paper ids), so it
survives a resync.

## Report to Claude

The dashboard's **Report to Claude** button copies plain text, one block per week changed since the last report:

```
Week <id>; dates: …; hours: …; done: …; unaided: …; stuck: …
Competency changes: <name> → <level> (<evidence>)
Derivations: <title> done closed-book on <date>
Papers: <title> → <depth>
```

Paste it into the Claude chat that maintains the canonical document. The time of the last report is stored, and the
report covers everything changed after it.

## Resync after the plan changes

1. Export the two tabs from the canonical document again, as Markdown, over `content/source/Curriculum.md` and
   `content/source/Lesson plan and log.md`.
2. `pnpm resync`.

The parser regenerates `content/curriculum.json` and `content/PARSE_NOTES.md`. Each week file carries the hash of
its source row in its frontmatter; only weeks whose row text changed are regenerated, as skeletons from the fixed
template, with the previous version moved to `content/weeks/.archive/` (ignored by git). Hand-expand the regenerated
files, then `pnpm check`. The parser fails loudly if the row count is not 49 (5 primer + 44) or the phase boundaries
disagree between the two files.

The fork of Labonne's LLM Course is cloned read-only into `content/source/llm-course/` (its README is the only
source of the Labonne links). To refresh it, re-clone it there.

## Layout

```
content/source/            the two exported tabs + llm-course README (inputs; do not edit by hand)
content/curriculum.json    generated: phases, 49 weeks, checkpoints, derivations, competencies, papers, resources
content/weeks/<id>.md      generated skeleton, then hand-expanded; frontmatter holds the source-row hash
content/PARSE_NOTES.md     generated: everything ambiguous or unverified in the conversion
scripts/parse-curriculum.ts, resync.ts, check-content.ts, e2e.mjs
src/types.ts               data model (Curriculum, Week, Progress, …)
src/store.ts               localStorage store, export/import, change journal for the report
src/pages/                 Dashboard, Plan, Week, Papers, Competencies, Derivations, Checkpoints, Log, Reviews, Resources, Settings
public/progress.json       import default (commit your export here)
```

## Content rules the generator follows

- Links only to URLs that appear in the source files or in the fork's README. Papers without a URL in the sources
  get an arXiv title-search link and are marked unverified. No arXiv IDs, DOIs, venues or dates are invented.
- Course lectures are referenced by topic, not number.
- No resources, courses, papers or hours beyond the source. No solutions to the derivations.
- Depth badge (built / derived / lecture-level) comes from the depth map by rule; every assignment is listed in
  `content/PARSE_NOTES.md`.
