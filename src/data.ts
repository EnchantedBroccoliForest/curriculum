import curriculumJson from "../content/curriculum.json";
import type { Curriculum, Week, WeekId } from "./types";

export const curriculum = curriculumJson as unknown as Curriculum;

// All week markdown files are bundled at build time (no runtime fetches).
const weekFiles = import.meta.glob("../content/weeks/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function weekFileName(id: WeekId): string {
  return /^P\d$/.test(id) ? `${id}.md` : `${id.padStart(2, "0")}.md`;
}

export function weekMarkdown(id: WeekId): string | undefined {
  const key = Object.keys(weekFiles).find((k) => k.endsWith(`/${weekFileName(id)}`));
  if (!key) return undefined;
  // Strip YAML frontmatter.
  return weekFiles[key].replace(/^---\n[\s\S]*?\n---\n/, "");
}

export const weeks: Week[] = curriculum.weeks;
export const weekById = new Map(weeks.map((w) => [w.id, w]));
export const phaseById = new Map(curriculum.phases.map((p) => [String(p.id), p]));

export function phaseName(id: Week["phase"]): string {
  return phaseById.get(String(id))?.name ?? String(id);
}
export function weekLabel(id: WeekId): string {
  return `Week ${id}`;
}
export function weekIndex(id: WeekId): number {
  return weeks.findIndex((w) => w.id === id);
}
