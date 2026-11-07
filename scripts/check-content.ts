// Validates content/weeks/*.md against content/curriculum.json and the content rules.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Curriculum } from "../src/types";
import { CURRICULUM_JSON, SOURCE_DIR, WEEKS_DIR, readFrontmatter, weekFileName } from "./lib";

const cur: Curriculum = JSON.parse(readFileSync(CURRICULUM_JSON, "utf8"));
const sourceText = ["Curriculum.md", "Lesson plan and log.md", "llm-course/README.md"]
  .map((f) => (existsSync(join(SOURCE_DIR, f)) ? readFileSync(join(SOURCE_DIR, f), "utf8") : ""))
  .join("\n");
const allowedUrlPrefixes = ["https://arxiv.org/search/?query=", "https://www.google.com/search?q=arxiv+"];
const required = [
  "## Why this week",
  "## Objectives",
  "## Key ideas",
  "## Derivation or exercise, stated in full",
  "## Self-check",
  "## Common misconceptions",
  "## Resources",
  "## Connects to",
];
const problems: string[] = [];
let expanded = 0;
for (const w of cur.weeks) {
  const file = join(WEEKS_DIR, weekFileName(w.id));
  if (!existsSync(file)) {
    problems.push(`${w.id}: missing file ${file}`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  const fm = readFrontmatter(text);
  if (fm.id !== w.id) problems.push(`${w.id}: frontmatter id "${fm.id}" differs`);
  if (fm.hash !== w.hash) problems.push(`${w.id}: frontmatter hash ${fm.hash} differs from row hash ${w.hash} (run pnpm resync)`);
  if (fm.depth !== w.depth) problems.push(`${w.id}: frontmatter depth ${fm.depth} differs from ${w.depth}`);
  if (fm.generated === "expanded") expanded++;
  else problems.push(`${w.id}: not yet expanded (generated: ${fm.generated})`);
  for (const h of required) if (!text.includes(h)) problems.push(`${w.id}: missing section "${h}"`);
  if (w.papers.length > 0 && !text.includes("## Judgment questions")) problems.push(`${w.id}: cites a paper but has no "## Judgment questions" section`);
  const lines = text.split("\n").length;
  const limit = w.depth === "lecture" && w.phase !== "P" && w.phase !== "C" ? 80 : 130;
  if (lines > limit) problems.push(`${w.id}: ${lines} lines exceeds the ${limit}-line limit`);
  if (!text.includes(w.exercise.trim())) problems.push(`${w.id}: the exercise statement from the source row is not present verbatim`);
  for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
    const url = m[1];
    if (sourceText.includes(url)) continue;
    if (allowedUrlPrefixes.some((p) => url.startsWith(p))) continue;
    problems.push(`${w.id}: URL not in any source file: ${url}`);
  }
  for (const m of text.matchAll(/\[week ([^\]]+)\]\(\/week\/([^)]+)\)/g)) {
    if (!cur.weeks.some((x) => x.id === m[2])) problems.push(`${w.id}: internal link to unknown week ${m[2]}`);
  }
  if (/\$\$[\s\S]*?\$\$/.test(text) === false && ["P3", "P5", "5", "12", "15", "30", "33"].includes(w.id)) {
    problems.push(`${w.id}: expected display math ($$...$$) on this week`);
  }
}
const extra = readdirSync(WEEKS_DIR).filter((f) => f.endsWith(".md") && !cur.weeks.some((w) => weekFileName(w.id) === f));
for (const f of extra) problems.push(`stray file content/weeks/${f}`);

console.log(`${expanded}/${cur.weeks.length} week files expanded.`);
if (problems.length) {
  console.log(problems.map((p) => `- ${p}`).join("\n"));
  process.exit(1);
}
console.log("All week files pass.");
