import { Link } from "react-router-dom";
import { curriculum, phaseName } from "../data";
import { actions, today, useProgress } from "../store";

export function Derivations() {
  const p = useProgress();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Closed-book derivations</h1>
      <p className="text-sm muted mb-4">Six in total, from memory, correct notation. Three are redone closed-book at week 44; a level drops if a retest fails.</p>
      <ul className="flex flex-col gap-3">
        {curriculum.derivations.map((d, i) => {
          const dp = p.derivations[d.id] ?? { done: false, closedBook: false };
          const overdue = dp.retestDue && dp.retestDue < today() && !dp.retestResult;
          return (
            <li key={d.id} className="card p-4">
              <div className="flex flex-wrap items-baseline gap-2 mb-3">
                <h2 className="font-semibold">
                  {i + 1}. {d.title}
                </h2>
                <span className="text-xs muted">
                  {phaseName(d.phase)} · due <Link to={`/week/${d.weekDue}`}>week {d.weekDue}</Link>
                </span>
                <span className={`badge ${dp.done ? "status-done" : ""}`}>{dp.done ? "done" : "not done"}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={dp.done} onChange={(e) => actions.setDerivation(d.id, { done: e.target.checked, closedBook: e.target.checked ? dp.closedBook : false })} />
                  Done
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={dp.closedBook} disabled={!dp.done} onChange={(e) => actions.setDerivation(d.id, { closedBook: e.target.checked })} />
                  Closed-book
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs muted">Date</span>
                  <input type="date" className="input" value={dp.date ?? ""} onChange={(e) => actions.setDerivation(d.id, { date: e.target.value || undefined })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={`text-xs ${overdue ? "overdue" : "muted"}`}>Retest due{overdue ? " (overdue)" : ""}</span>
                  <input type="date" className="input" value={dp.retestDue ?? ""} onChange={(e) => actions.setDerivation(d.id, { retestDue: e.target.value || undefined })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs muted">Retest result</span>
                  <input className="input" value={dp.retestResult ?? ""} placeholder="pass / fail, notes" onChange={(e) => actions.setDerivation(d.id, { retestResult: e.target.value || undefined })} />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
