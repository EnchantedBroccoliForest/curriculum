// Progress store: a single versioned localStorage key, React subscription via useSyncExternalStore,
// Export/Import JSON, and progress.json in the repo as the import default.
import { useSyncExternalStore } from "react";
import type { Level, Progress, WeekId, WeekProgress } from "./types";
import { curriculum } from "./data";

export const STORAGE_KEY = "ai-curriculum-progress:v1";

export function emptyProgress(): Progress {
  return {
    version: 1,
    targetHoursPerWeek: curriculum.totals.hoursPerWeek,
    weeks: {},
    derivations: {},
    competencies: {},
    checkpoints: {},
    papers: {},
    log: [],
    reviews: [],
    changes: [],
  };
}

export function defaultWeek(): WeekProgress {
  return { status: "not_started", hours: 0, notes: "", exerciseDone: false };
}

/** Validate and normalise an imported object into a Progress value. Throws on a bad shape. */
export function normalise(input: unknown): Progress {
  if (!input || typeof input !== "object") throw new Error("Not a JSON object");
  const o = input as Record<string, unknown>;
  if (o.version !== 1) throw new Error(`Unsupported progress version: ${String(o.version)}`);
  const base = emptyProgress();
  const asRecord = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, never>) : {});
  const asArray = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    ...base,
    startDate: typeof o.startDate === "string" ? o.startDate : undefined,
    targetHoursPerWeek: typeof o.targetHoursPerWeek === "number" && o.targetHoursPerWeek > 0 ? o.targetHoursPerWeek : base.targetHoursPerWeek,
    weeks: asRecord(o.weeks),
    derivations: asRecord(o.derivations),
    competencies: asRecord(o.competencies),
    checkpoints: asRecord(o.checkpoints),
    papers: asRecord(o.papers),
    log: asArray(o.log),
    reviews: asArray(o.reviews),
    specialization: typeof o.specialization === "string" ? o.specialization : undefined,
    lastReportAt: typeof o.lastReportAt === "string" ? o.lastReportAt : undefined,
    changes: asArray(o.changes),
  };
}

let state: Progress = load();
const listeners = new Set<() => void>();

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalise(JSON.parse(raw));
  } catch (e) {
    console.warn("Could not read saved progress; starting empty.", e);
  }
  return emptyProgress();
}

function persist(next: Progress) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("Could not save progress", e);
  }
  listeners.forEach((l) => l());
}

export function getProgress(): Progress {
  return state;
}
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
export function addWeeks(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 7 * n);
  return d.toISOString().slice(0, 10);
}

/** The first week that is neither done nor skipped. */
export function currentWeekId(p: Progress = state): WeekId {
  const w = curriculum.weeks.find((w) => {
    const s = p.weeks[w.id]?.status ?? "not_started";
    return s !== "done" && s !== "skipped";
  });
  return w?.id ?? curriculum.weeks[curriculum.weeks.length - 1].id;
}

function journal(p: Progress, kind: Progress["changes"][number]["kind"], id: string, detail: string, week?: WeekId): Progress {
  const at = new Date().toISOString();
  return { ...p, changes: [...p.changes, { at, kind, id, detail: week ? `${week}\u001f${detail}` : detail }] };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export const actions = {
  replaceAll(next: Progress) {
    persist(normalise(next));
  },
  reset() {
    persist(emptyProgress());
  },
  setSettings(patch: Partial<Pick<Progress, "startDate" | "targetHoursPerWeek" | "specialization">>) {
    persist({ ...state, ...patch });
  },
  updateWeek(id: WeekId, patch: Partial<WeekProgress>) {
    const prev = state.weeks[id] ?? defaultWeek();
    const next: WeekProgress = { ...prev, ...patch };
    if (patch.status && patch.status !== prev.status) {
      if (patch.status === "in_progress" && !next.started) next.started = today();
      if (patch.status === "done") next.done = next.done ?? today();
      if (patch.status !== "done") next.done = undefined;
    }
    let p: Progress = { ...state, weeks: { ...state.weeks, [id]: next } };
    const details: string[] = [];
    if (patch.status && patch.status !== prev.status) details.push(`status → ${patch.status}`);
    if (patch.hours !== undefined && patch.hours !== prev.hours) details.push(`hours → ${patch.hours}`);
    if (patch.exerciseDone !== undefined && patch.exerciseDone !== prev.exerciseDone) details.push(`exercise ${patch.exerciseDone ? "done" : "undone"}`);
    if (details.length) p = journal(p, "week", id, details.join("; "), id);
    persist(p);
  },
  addLog(entry: Omit<Progress["log"][number], "created">) {
    const created = new Date().toISOString();
    const wk = state.weeks[entry.week] ?? defaultWeek();
    const nextWeek: WeekProgress = {
      ...wk,
      hours: Math.round((wk.hours + entry.hours) * 100) / 100,
      status: wk.status === "not_started" ? "in_progress" : wk.status,
      started: wk.started ?? today(),
    };
    let p: Progress = { ...state, log: [...state.log, { ...entry, created }], weeks: { ...state.weeks, [entry.week]: nextWeek } };
    p = journal(p, "week", entry.week, `log entry (${entry.hours} h)`, entry.week);
    persist(p);
  },
  deleteLog(index: number) {
    const entry = state.log[index];
    if (!entry) return;
    const wk = state.weeks[entry.week];
    const weeks = wk ? { ...state.weeks, [entry.week]: { ...wk, hours: Math.max(0, Math.round((wk.hours - entry.hours) * 100) / 100) } } : state.weeks;
    persist({ ...state, log: state.log.filter((_, i) => i !== index), weeks });
  },
  setDerivation(id: string, patch: Partial<Progress["derivations"][string]>) {
    const prev = state.derivations[id] ?? { done: false, closedBook: false };
    const next = { ...prev, ...patch };
    if (patch.done && !prev.done) next.date = next.date ?? today();
    let p: Progress = { ...state, derivations: { ...state.derivations, [id]: next } };
    if (patch.done !== undefined && patch.done !== prev.done) {
      const title = curriculum.derivations.find((d) => d.id === id)?.title ?? id;
      const due = curriculum.derivations.find((d) => d.id === id)?.weekDue;
      p = journal(p, "derivation", id, `${title} ${next.done ? `done${next.closedBook ? " closed-book" : ""} on ${next.date}` : "unmarked"}`, due);
    }
    persist(p);
  },
  setCompetency(id: string, patch: Partial<Progress["competencies"][string]>) {
    const prev = state.competencies[id] ?? { level: "U" as Level, evidence: "" };
    const next = { ...prev, ...patch };
    let p: Progress = state;
    if (patch.level !== undefined && patch.level !== prev.level) {
      next.date = today();
      next.retestDue = addWeeks(next.date, 5);
      const name = curriculum.competencies.find((c) => c.id === id)?.name ?? id;
      p = journal(p, "competency", id, `${name} → ${next.level} (${next.evidence || "no evidence recorded"})`, currentWeekId(p));
    }
    persist({ ...p, competencies: { ...p.competencies, [id]: next } });
  },
  setCheckpoint(id: string, patch: Partial<Progress["checkpoints"][string]>) {
    const prev = state.checkpoints[id] ?? { done: false };
    const next = { ...prev, ...patch };
    if (patch.done && !prev.done) next.date = next.date ?? today();
    persist({ ...state, checkpoints: { ...state.checkpoints, [id]: next } });
  },
  setPaper(id: string, patch: Partial<Progress["papers"][string]>) {
    const prev = state.papers[id] ?? { depth: "unread" as const, claim: "", evidence: "", weakest: "", judgmentFails: [] };
    const next = { ...prev, ...patch };
    let p: Progress = state;
    if (patch.depth !== undefined && patch.depth !== prev.depth) {
      next.date = today();
      const paper = curriculum.papers.find((x) => x.id === id);
      p = journal(p, "paper", id, `${paper?.title ?? id} → ${next.depth}`, paper?.weeks[0] ?? currentWeekId(p));
    }
    persist({ ...p, papers: { ...p.papers, [id]: next } });
  },
  addReview(entry: { date: string; change: string }) {
    persist({ ...state, reviews: [...state.reviews, entry] });
  },
  markReported() {
    persist({ ...state, lastReportAt: new Date().toISOString() });
  },
};

export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

/** Load progress.json shipped with the site (import default), if present. */
export async function fetchRepoProgress(): Promise<Progress | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}progress.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    return normalise(JSON.parse(text));
  } catch {
    return null;
  }
}

/** On first load with nothing in localStorage, take progress.json from the repo as the default. */
export async function bootstrapFromRepo(): Promise<boolean> {
  if (localStorage.getItem(STORAGE_KEY)) return false;
  const p = await fetchRepoProgress();
  if (!p) return false;
  persist(p);
  return true;
}
