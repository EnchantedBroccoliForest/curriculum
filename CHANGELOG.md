# Changelog

## 0.1.0 — 2026-11-07

- Parser (`scripts/parse-curriculum.ts`) for the two exported tabs of the canonical document: 6 phases, 49 weeks,
  19 checkpoint artifacts, 6 closed-book derivations, 12 competencies with targets, 51 papers, 73 resources,
  review log, milestones. Fails loudly on a wrong row count; writes `content/PARSE_NOTES.md`.
- Expanded notes for all 49 weeks (`content/weeks/`), from a fixed template: why this week, objectives, key ideas,
  the exercise stated in full with at most three hints, self-check, misconceptions, judgment-question checklist on
  paper weeks, resources, connections. Capstone weeks use the method template.
- Vite + React + TypeScript + Tailwind app: dashboard, plan, week pages with KaTeX, papers register, competency
  ledger with automatic retest dates, derivations, checkpoints, weekly log, reviews with a pace-review preview,
  resources, settings with export/import/reset and `progress.json` as the import default. Dark mode by
  `prefers-color-scheme`; keyboard-navigable; works offline after the first load.
- "Report to Claude" button producing the fixed plain-text report shape.
- `pnpm resync` regenerates only the week files whose source row changed; `pnpm check` validates the week files.
