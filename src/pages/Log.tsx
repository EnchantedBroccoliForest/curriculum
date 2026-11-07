import { Link } from "react-router-dom";
import { actions, useProgress } from "../store";
import { LogForm } from "../components/LogForm";

export function Log() {
  const p = useProgress();
  const rows = p.log.map((e, i) => ({ ...e, i })).reverse();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Weekly log</h1>
      <p className="text-sm muted mb-4">One row per week, newest first. Hours measure effort; a competency level is set only from the unaided column.</p>
      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-3">New entry</h2>
        <LogForm />
      </section>
      <div className="overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Wk</th>
              <th>Dates</th>
              <th>Hrs</th>
              <th>Done</th>
              <th>Unaided derivation or answer</th>
              <th>Stuck on</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No weeks logged yet.
                </td>
              </tr>
            )}
            {rows.map((e) => (
              <tr key={e.i}>
                <td>
                  <Link to={`/week/${e.week}`}>{e.week}</Link>
                </td>
                <td className="whitespace-nowrap">{e.dates || "—"}</td>
                <td>{e.hours}</td>
                <td className="whitespace-pre-wrap">{e.done || "—"}</td>
                <td className="whitespace-pre-wrap">{e.unaided || "—"}</td>
                <td className="whitespace-pre-wrap">{e.stuck || "—"}</td>
                <td>
                  <button type="button" className="btn" onClick={() => actions.deleteLog(e.i)} aria-label={`Delete log entry for week ${e.week} created ${e.created}`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
