// pnpm resync: re-run the parser on freshly exported source files and regenerate only the week files
// whose source row changed (compared by the hash kept in each week file's frontmatter).
// Progress is keyed by stable ids and is never touched.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import type { Curriculum } from "../src/types";
import { CURRICULUM_JSON, NOTES_MD, WEEKS_DIR, readFrontmatter, weekFileName, weekSkeleton } from "./lib";

execFileSync("pnpm", ["exec", "tsx", "scripts/parse-curriculum.ts"], { stdio: "inherit" });
const cur: Curriculum = JSON.parse(readFileSync(CURRICULUM_JSON, "utf8"));

const archive = join(WEEKS_DIR, ".archive");
const regenerated: string[] = [];
const created: string[] = [];
for (const w of cur.weeks) {
  const file = join(WEEKS_DIR, weekFileName(w.id));
  if (!existsSync(file)) {
    writeFileSync(file, weekSkeleton(w, cur));
    created.push(w.id);
    continue;
  }
  const fm = readFrontmatter(readFileSync(file, "utf8"));
  if (fm.hash === w.hash) continue;
  mkdirSync(archive, { recursive: true });
  renameSync(file, join(archive, `${weekFileName(w.id)}.${fm.hash || "nohash"}.md`));
  writeFileSync(file, weekSkeleton(w, cur));
  regenerated.push(w.id);
}

const stamp = new Date().toISOString().slice(0, 10);
if (regenerated.length || created.length) {
  appendFileSync(
    NOTES_MD,
    `\n## Resync ${stamp}\n\n` +
      (regenerated.length
        ? `Source rows changed; week files regenerated as skeletons (previous versions in content/weeks/.archive) and need hand-expansion: ${regenerated.join(", ")}.\n`
        : "") +
      (created.length ? `Week files created: ${created.join(", ")}.\n` : ""),
  );
}
console.log(
  regenerated.length || created.length
    ? `Resync: regenerated ${regenerated.length} week file(s) [${regenerated.join(", ")}], created ${created.length} [${created.join(", ")}]. Other week files untouched.`
    : "Resync: no source rows changed; no week files touched.",
);
