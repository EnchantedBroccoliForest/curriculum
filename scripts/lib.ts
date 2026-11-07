// Shared helpers for parse-curriculum.ts and resync.ts.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Week, Curriculum } from "../src/types";

export const ROOT = process.cwd();
export const SOURCE_DIR = join(ROOT, "content", "source");
export const WEEKS_DIR = join(ROOT, "content", "weeks");
export const CURRICULUM_JSON = join(ROOT, "content", "curriculum.json");
export const NOTES_MD = join(ROOT, "content", "PARSE_NOTES.md");

export type Table = { heading: string; headers: string[]; rows: string[][] };

export function readSource(name: string): string {
  const p = join(SOURCE_DIR, name);
  if (!existsSync(p)) {
    throw new Error(`Missing source file: ${p}. Export it from the canonical document and retry.`);
  }
  return readFileSync(p, "utf8").replace(/\r\n/g, "\n");
}

/** Split a markdown table row into trimmed cells, tolerant of stray pipes inside code spans. */
export function splitRow(line: string): string[] {
  const s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cur = "";
  let inCode = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "`") inCode = !inCode;
    if (ch === "|" && !inCode && s[i - 1] !== "\\") {
      cells.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells.map((c) => c.replace(/\\\|/g, "|"));
}

/** Every pipe table in a markdown document, tagged with the nearest preceding heading. */
export function parseTables(md: string): Table[] {
  const lines = md.split("\n");
  const tables: Table[] = [];
  let heading = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) heading = h[1].trim();
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const headers = splitRow(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && /^\s*\|/.test(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      tables.push({ heading, headers, rows });
      i = j - 1;
    }
  }
  return tables;
}

/** Sections keyed by "## " heading text → body lines. */
export function sections(md: string): Map<string, string> {
  const out = new Map<string, string>();
  let cur = "";
  let buf: string[] = [];
  for (const line of md.split("\n")) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      if (cur) out.set(cur, buf.join("\n"));
      cur = h[1].trim();
      buf = [];
    } else buf.push(line);
  }
  if (cur) out.set(cur, buf.join("\n"));
  return out;
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function rowHash(cells: string[]): string {
  return createHash("sha1").update(cells.map((c) => c.replace(/\s+/g, " ").trim()).join(" | ")).digest("hex").slice(0, 12);
}

export function weekFileName(id: string): string {
  return /^P\d$/.test(id) ? `${id}.md` : `${id.padStart(2, "0")}.md`;
}

export function readFrontmatter(text: string): Record<string, string> {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  const out: Record<string, string> = {};
  if (!m) return out;
  for (const line of m[1].split("\n")) {
    const kv = /^([A-Za-z_]+):\s*"?(.*?)"?\s*$/.exec(line);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}

/** Markdown skeleton for a week, from the fixed template. Hand-expanded afterwards. */
export function weekSkeleton(week: Week, cur: Curriculum): string {
  const idx = cur.weeks.findIndex((w) => w.id === week.id);
  const prev = cur.weeks[idx - 1];
  const next = cur.weeks[idx + 1];
  const res = week.resources
    .map((id) => cur.resources.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => (r.url ? `- [${r.name}](${r.url})` : `- ${r.name} (no URL in the source)`));
  const papers = week.papers
    .map((id) => cur.papers.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => `- Paper: [${p.title}${p.year ? ` (${p.year})` : ""}](${p.url})${p.urlStatus === "source" ? "" : " — title search, no verified URL in the source"}`);
  const title = `Week ${week.id}`;
  const topic = (week.lecture || week.reading || week.exercise).replace(/\s+/g, " ");
  const judgment =
    week.papers.length > 0
      ? `## Judgment questions\n\nFor each paper read this week:\n\n${cur.judgmentQuestions.map((q) => `- [ ] ${q}`).join("\n")}\n\n`
      : "";
  return `---
id: "${week.id}"
hash: ${week.hash}
depth: ${week.depth}
generated: skeleton
---

# ${title}: ${topic}

## Why this week

_Not yet expanded._

## Objectives

- _Not yet expanded._

## Key ideas

- _Not yet expanded._

## Derivation or exercise, stated in full

${week.exercise}

<details>
<summary>Hints</summary>

_No hints yet._

</details>

## Self-check

1. _Not yet expanded._

## Common misconceptions

- _Not yet expanded._

${judgment}## Resources

${[...res, ...papers].join("\n") || "- None listed in the source row."}

## Connects to

${prev ? `- Prior: week ${prev.id}` : "- Prior: none (first week)"}
${next ? `- Later: week ${next.id}` : "- Later: none (last week)"}
`;
}
