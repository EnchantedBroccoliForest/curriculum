// "Report to Claude": plain text, one block per week changed since the last report.
import type { Progress } from "./types";
import { curriculum } from "./data";

const SEP = "\u001f";

export function buildReport(p: Progress): string {
  const since = p.lastReportAt ?? "";
  const changes = p.changes.filter((c) => c.at > since);
  const byWeek = new Map<string, typeof changes>();
  for (const c of changes) {
    const [week, detail] = c.detail.includes(SEP) ? c.detail.split(SEP) : ["", c.detail];
    const key = week || "—";
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push({ ...c, detail });
  }
  const order = (id: string) => (id === "—" ? 1e9 : id.startsWith("P") ? Number(id.slice(1)) : 100 + Number(id));
  const blocks: string[] = [];
  for (const week of [...byWeek.keys()].sort((a, b) => order(a) - order(b))) {
    const cs = byWeek.get(week)!;
    const logs = p.log.filter((l) => l.week === week && l.created > since);
    const latest = logs[logs.length - 1];
    const wp = p.weeks[week];
    const lines: string[] = [];
    if (week !== "—") {
      lines.push(
        `Week ${week}; dates: ${latest?.dates ?? "—"}; hours: ${latest ? logs.reduce((s, l) => s + l.hours, 0) : wp?.hours ?? 0}; done: ${latest?.done ?? (wp?.status === "done" ? "week marked done" : "—")}; unaided: ${latest?.unaided ?? "—"}; stuck: ${latest?.stuck ?? "—"}`,
      );
    } else {
      lines.push("Changes not tied to a week");
    }
    const comp = cs.filter((c) => c.kind === "competency").map((c) => c.detail);
    const der = cs.filter((c) => c.kind === "derivation").map((c) => c.detail);
    const pap = cs.filter((c) => c.kind === "paper").map((c) => c.detail);
    lines.push(`Competency changes: ${comp.length ? comp.join("; ") : "none"}`);
    lines.push(`Derivations: ${der.length ? der.join("; ") : "none"}`);
    lines.push(`Papers: ${pap.length ? pap.join("; ") : "none"}`);
    blocks.push(lines.join("\n"));
  }
  if (blocks.length === 0) {
    return `No changes since the last report${p.lastReportAt ? ` (${p.lastReportAt.slice(0, 10)})` : ""}.`;
  }
  void curriculum;
  return blocks.join("\n\n");
}
