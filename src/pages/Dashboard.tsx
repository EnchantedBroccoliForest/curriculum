import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { curriculum, weekById } from "../data";
import { actions, addWeeks, currentWeekId, today, useProgress } from "../store";
import { buildReport } from "../report";
import { DepthBadge, Section } from "../components/ui";
import type { Level } from "../types";

function levelNum(l: Level): number {
  return l === "U" ? 0 : l;
}

export function Dashboard() {
  const p = useProgress();
  const current = weekById.get(currentWeekId(p))!;
  const total = curriculum.weeks.length;
  const done = curriculum.weeks.filter((w) => p.weeks[w.id]?.status === "done").length;
  const hoursLogged = curriculum.weeks.reduce((s, w) => s + (p.weeks[w.id]?.hours ?? 0), 0);
  const planned = curriculum.totals.plannedHours;

  // Hours per week over time: weeks with any hours, in curriculum order.
  const series = curriculum.weeks.filter((w) => (p.weeks[w.id]?.hours ?? 0) > 0).map((w) => ({ id: w.id, hours: p.weeks[w.id]!.hours }));
  const loggedWeeks = new Set(p.log.map((l) => l.week)).size;

  // Projected finish from measured pace: study weeks completed per calendar week since the start date.
  const projection = useMemo(() => {
    if (!p.startDate || loggedWeeks < 4 || done === 0) return null;
    const elapsedDays = (Date.parse(today()) - Date.parse(p.startDate)) / 86400000;
    if (elapsedDays <= 0) return null;
    const pace = done / (elapsedDays / 7); // study weeks per calendar week
    const remaining = total - done;
    const finish = new Date(Date.parse(today()) + (remaining / pace) * 7 * 86400000).toISOString().slice(0, 10);
    return { pace, finish };
  }, [p.startDate, loggedWeeks, done, total]);

  const nextDerivation = curriculum.derivations.find((d) => !p.derivations[d.id]?.done);
  const retests = [
    ...curriculum.competencies.map((c) => ({ what: c.name, due: p.competencies[c.id]?.retestDue, to: "/competencies" })),
    ...curriculum.derivations.map((d) => ({ what: d.title, due: p.derivations[d.id]?.retestDue, to: "/derivations" })),
  ]
    .filter((r): r is { what: string; due: string; to: string } => !!r.due)
    .sort((a, b) => a.due.localeCompare(b.due));
  const nextRetest = retests[0];

  const [copied, setCopied] = useState("");
  const [reportText, setReportText] = useState("");
  async function report() {
    const text = buildReport(p);
    setReportText(text);
    actions.markReported();
    try {
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 1500))]);
      setCopied("Report copied to the clipboard.");
    } catch {
      setCopied("Clipboard unavailable; copy the text below.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Current week">
          <p className="text-lg font-semibold">
            <Link to={`/week/${current.id}`}>Week {current.id}</Link> <DepthBadge depth={current.depth} />
          </p>
          <p className="text-sm mt-1">{current.lecture || current.reading}</p>
          <p className="text-xs muted mt-1">
            {curriculum.phases.find((ph) => ph.id === current.phase)?.name} · {current.hours} h planned
            {current.gate ? ` · ${current.gate}` : ""}
          </p>
          {!p.startDate && (
            <p className="text-xs muted mt-2">
              Start date unset until P1 begins. <Link to="/settings">Set it in Settings.</Link>
            </p>
          )}
        </Section>
        <Section title="Overall progress">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="muted">Weeks done</dt>
            <dd>
              {done} / {total} <span className="muted">(+{curriculum.totals.bufferWeeks} buffer weeks unassigned)</span>
            </dd>
            <dt className="muted">Hours logged</dt>
            <dd>
              {hoursLogged} / {planned}
            </dd>
            <dt className="muted">Projected finish</dt>
            <dd>
              {projection ? (
                <>
                  {projection.finish} <span className="muted">({projection.pace.toFixed(2)} study weeks per calendar week)</span>
                </>
              ) : (
                <span className="muted">calibrating (needs a start date and 4 logged weeks)</span>
              )}
            </dd>
          </dl>
        </Section>
        <Section title="Hours per week">
          <HoursChart series={series} target={p.targetHoursPerWeek} />
        </Section>
        <Section title="Next due">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="muted">Derivation</dt>
            <dd>
              {nextDerivation ? (
                <Link to="/derivations">
                  {nextDerivation.title} <span className="muted">(due week {nextDerivation.weekDue})</span>
                </Link>
              ) : (
                "all six done"
              )}
            </dd>
            <dt className="muted">Retest</dt>
            <dd>
              {nextRetest ? (
                <Link to={nextRetest.to} className={nextRetest.due < today() ? "overdue" : ""}>
                  {nextRetest.what} <span className="muted">({nextRetest.due})</span>
                </Link>
              ) : (
                <span className="muted">none scheduled</span>
              )}
            </dd>
          </dl>
        </Section>
      </div>
      <Section
        title="Competencies against target"
        aside={
          <Link to="/competencies" className="text-sm">
            Ledger
          </Link>
        }
      >
        <ol className="grid gap-1 sm:grid-cols-2">
          {curriculum.competencies.map((c) => {
            const lvl = p.competencies[c.id]?.level ?? "U";
            const met = levelNum(lvl) >= c.target;
            return (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 flex gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      className="h-2 flex-1 rounded-sm"
                      style={{
                        background: n <= levelNum(lvl) ? "var(--chart-1)" : "var(--line)",
                        outline: n === c.target ? "2px solid var(--chart-target)" : undefined,
                        outlineOffset: n === c.target ? "1px" : undefined,
                      }}
                    />
                  ))}
                </span>
                <span className="truncate" title={c.name}>
                  {c.name}
                </span>
                <span className={`ml-auto shrink-0 ${met ? "status-done" : "muted"}`}>
                  {lvl} / {c.target}
                </span>
              </li>
            );
          })}
        </ol>
      </Section>
      <Section title="Report to Claude">
        <p className="text-sm muted mb-2">
          Copies one block per week changed since the last report ({p.lastReportAt ? p.lastReportAt.slice(0, 10) : "never"}) in the shape the canonical
          document expects.
        </p>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={report}>
            Report to Claude
          </button>
          <span role="status" className="text-sm muted">
            {copied}
          </span>
        </div>
        {reportText && (
          <pre className="mt-3 text-xs whitespace-pre-wrap card p-3" aria-label="Report text">
            {reportText}
          </pre>
        )}
      </Section>
      <p className="text-xs muted">
        Next retest window: a competency set today would be retested on {addWeeks(today(), 5)}.
      </p>
    </div>
  );
}

function HoursChart({ series, target }: { series: { id: string; hours: number }[]; target: number }) {
  if (series.length === 0) return <p className="text-sm muted">No hours logged yet.</p>;
  const w = 600;
  const h = 160;
  const pad = { l: 28, r: 8, t: 8, b: 22 };
  const max = Math.max(target, ...series.map((s) => s.hours)) * 1.1;
  const bw = (w - pad.l - pad.r) / series.length;
  const y = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-labelledby="hours-chart-title" className="w-full h-auto">
        <title id="hours-chart-title">Hours logged per study week, with the target line</title>
        <line x1={pad.l} x2={w - pad.r} y1={y(0)} y2={y(0)} stroke="var(--line)" />
        <line x1={pad.l} x2={w - pad.r} y1={y(target)} y2={y(target)} stroke="var(--chart-target)" strokeDasharray="4 3" strokeWidth="1.5" />
        <text x={pad.l - 4} y={y(target) + 4} fontSize="10" textAnchor="end" fill="var(--muted)">
          {target}
        </text>
        <text x={pad.l - 4} y={y(0) + 4} fontSize="10" textAnchor="end" fill="var(--muted)">
          0
        </text>
        {series.map((s, i) => {
          const x = pad.l + i * bw + 1;
          const bh = y(0) - y(s.hours);
          return (
            <g key={s.id}>
              <rect x={x} y={y(s.hours)} width={Math.max(2, bw - 2)} height={Math.max(0, bh)} rx="2" fill="var(--chart-1)">
                <title>{`Week ${s.id}: ${s.hours} h`}</title>
              </rect>
              {series.length <= 26 && (
                <text x={x + (bw - 2) / 2} y={h - 8} fontSize="9" textAnchor="middle" fill="var(--muted)">
                  {s.id}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        <table>
          <caption>Hours per week</caption>
          <thead>
            <tr>
              <th>Week</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
      <p className="text-xs muted mt-1">Dashed line: target {target} h/week.</p>
    </figure>
  );
}
