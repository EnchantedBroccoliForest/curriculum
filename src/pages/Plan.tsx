import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { curriculum } from "../data";
import { actions, defaultWeek, useProgress } from "../store";
import { DepthBadge, StatusSelect } from "../components/ui";
import type { PhaseId, WeekStatus } from "../types";

export function Plan() {
  const p = useProgress();
  const [phase, setPhase] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [hasPaper, setHasPaper] = useState(false);
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return curriculum.weeks.filter((w) => {
      if (phase !== "all" && String(w.phase) !== phase) return false;
      const s = p.weeks[w.id]?.status ?? "not_started";
      if (status !== "all" && s !== status) return false;
      if (hasPaper && w.papers.length === 0) return false;
      if (needle && !`${w.lecture} ${w.reading} ${w.exercise}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [p, phase, status, hasPaper, q]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Plan</h1>
      <p className="text-sm muted mb-4">
        {curriculum.totals.activeWeeks} active weeks plus {curriculum.totals.bufferWeeks} buffer weeks, {curriculum.totals.hoursPerWeek} hours each.
        Hours are the plan's; they are not edited here.
      </p>
      <form className="card p-3 mb-4 grid gap-3 sm:grid-cols-4" onSubmit={(e) => e.preventDefault()} aria-label="Filters">
        <div>
          <label htmlFor="f-phase" className="text-xs muted block">
            Phase
          </label>
          <select id="f-phase" className="select" value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="all">All</option>
            {curriculum.phases.map((ph) => (
              <option key={String(ph.id)} value={String(ph.id)}>
                {ph.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="text-xs muted block">
            Status
          </label>
          <select id="f-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={hasPaper} onChange={(e) => setHasPaper(e.target.checked)} /> Has paper
          </label>
        </div>
        <div>
          <label htmlFor="f-q" className="text-xs muted block">
            Search lecture, reading, exercise
          </label>
          <input id="f-q" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </form>

      {curriculum.phases.map((ph) => {
        const rows = visible.filter((w) => w.phase === ph.id);
        if (rows.length === 0) return null;
        const doneCount = curriculum.weeks.filter((w) => w.phase === ph.id && p.weeks[w.id]?.status === "done").length;
        const totalCount = curriculum.weeks.filter((w) => w.phase === ph.id).length;
        return (
          <details key={String(ph.id)} open className="card mb-3">
            <summary className="cursor-pointer px-4 py-3 font-semibold flex flex-wrap items-baseline gap-x-3">
              <span>{ph.name}</span>
              <span className="text-sm muted font-normal">
                weeks {ph.weeks[0]}–{ph.weeks[1]} · {ph.hours} h · {doneCount}/{totalCount} done
              </span>
            </summary>
            <div className="px-4 pb-3">
              <p className="text-sm muted mb-3">
                <span className="font-medium">Exit condition:</span> {ph.exitCondition}
              </p>
              <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {rows.map((w) => (
                  <WeekRow key={w.id} id={w.id} phase={ph.id} />
                ))}
              </ul>
            </div>
          </details>
        );
      })}
      {visible.length === 0 && <p className="text-sm muted">No weeks match the filters.</p>}
    </div>
  );
}

function WeekRow({ id, phase }: { id: string; phase: PhaseId }) {
  const p = useProgress();
  const w = curriculum.weeks.find((x) => x.id === id)!;
  const wp = p.weeks[id] ?? defaultWeek();
  void phase;
  return (
    <li className="py-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/week/${w.id}`} className="font-semibold">
            Week {w.id}
          </Link>
          <DepthBadge depth={w.depth} />
          {w.gate && <span className="badge">{w.gate}</span>}
          {w.papers.length > 0 && <span className="badge">{w.papers.length} paper{w.papers.length > 1 ? "s" : ""}</span>}
          <span className="text-xs muted">{w.hours} h</span>
        </div>
        <p className="text-sm mt-1">{w.lecture || <span className="muted">—</span>}</p>
        {w.reading && <p className="text-sm muted mt-0.5">Reading: {w.reading}</p>}
        <p className="text-sm mt-0.5">
          <span className="muted">Exercise:</span> {w.exercise}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <div className="w-36">
          <StatusSelect id={`status-${w.id}`} label={`Status of week ${w.id}`} value={wp.status as WeekStatus} onChange={(s) => actions.updateWeek(w.id, { status: s })} />
        </div>
        <label className="text-sm flex items-center gap-1">
          <span className="muted">h</span>
          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            className="input input-sm"
            aria-label={`Hours logged for week ${w.id}`}
            value={wp.hours}
            onChange={(e) => actions.updateWeek(w.id, { hours: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
        <label className="text-sm flex items-center gap-1">
          <input type="checkbox" checked={wp.exerciseDone} onChange={(e) => actions.updateWeek(w.id, { exerciseDone: e.target.checked })} aria-label={`Exercise done for week ${w.id}`} />
          Exercise
        </label>
      </div>
    </li>
  );
}
