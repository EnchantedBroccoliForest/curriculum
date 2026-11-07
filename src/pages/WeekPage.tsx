import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { curriculum, weekById, weekIndex, weekMarkdown, phaseName } from "../data";
import { actions, defaultWeek, useProgress } from "../store";
import { Markdown } from "../components/Markdown";
import { LogForm } from "../components/LogForm";
import { DepthBadge, Field, StatusSelect } from "../components/ui";

export function WeekPage() {
  const { id = "" } = useParams();
  const p = useProgress();
  const week = weekById.get(id);
  if (!week) {
    return (
      <p>
        Unknown week "{id}". <Link to="/plan">Back to the plan.</Link>
      </p>
    );
  }
  const md = weekMarkdown(week.id);
  const idx = weekIndex(week.id);
  const prev = curriculum.weeks[idx - 1];
  const next = curriculum.weeks[idx + 1];
  const wp = p.weeks[week.id] ?? defaultWeek();
  const derivations = curriculum.derivations.filter((d) => d.weekDue === week.id);

  return (
    <article>
      <nav aria-label="Week navigation" className="flex justify-between text-sm mb-3">
        <span>{prev ? <Link to={`/week/${prev.id}`}>← Week {prev.id}</Link> : <span className="muted">First week</span>}</span>
        <Link to="/plan">Plan</Link>
        <span>{next ? <Link to={`/week/${next.id}`}>Week {next.id} →</Link> : <span className="muted">Last week</span>}</span>
      </nav>
      <header className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <DepthBadge depth={week.depth} />
        <span className="badge">{phaseName(week.phase)}</span>
        <span className="badge">{week.hours} h</span>
        {week.gate && <span className="badge">{week.gate}</span>}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {md ? <Markdown source={md} /> : <p className="muted">No expanded notes for this week yet.</p>}
          <section className="card p-4 mt-6">
            <h2 className="font-semibold mb-2">Source row</h2>
            <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="muted">Lecture or chapter</dt>
              <dd>{week.lecture || "—"}</dd>
              <dt className="muted">Reading</dt>
              <dd>{week.reading || "—"}</dd>
              <dt className="muted">Exercise</dt>
              <dd>{week.exercise}</dd>
            </dl>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 self-start">
          <section className="card p-4">
            <h2 className="font-semibold mb-3">Progress</h2>
            <div className="flex flex-col gap-3">
              <Field label="Status" htmlFor={`w-status-${week.id}`}>
                <StatusSelect id={`w-status-${week.id}`} label="Week status" value={wp.status} onChange={(s) => actions.updateWeek(week.id, { status: s })} />
              </Field>
              <Field label="Hours" htmlFor={`w-hours-${week.id}`} hint={`Planned: ${week.hours} h. Log entries add to this.`}>
                <input
                  id={`w-hours-${week.id}`}
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  className="input"
                  value={wp.hours}
                  onChange={(e) => actions.updateWeek(week.id, { hours: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Field>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={wp.exerciseDone} onChange={(e) => actions.updateWeek(week.id, { exerciseDone: e.target.checked })} />
                Exercise done closed-book
              </label>
              <Field label="Notes" htmlFor={`w-notes-${week.id}`}>
                <textarea id={`w-notes-${week.id}`} className="textarea" rows={4} value={wp.notes} onChange={(e) => actions.updateWeek(week.id, { notes: e.target.value })} />
              </Field>
              {(wp.started || wp.done) && (
                <p className="text-xs muted">
                  {wp.started && `Started ${wp.started}`}
                  {wp.started && wp.done && " · "}
                  {wp.done && `Done ${wp.done}`}
                </p>
              )}
            </div>
          </section>

          {derivations.length > 0 && (
            <section className="card p-4">
              <h2 className="font-semibold mb-1">Closed-book derivations due</h2>
              <p className="text-xs muted mb-3">Mark done only after confirming the derivation was done closed-book.</p>
              <ul className="flex flex-col gap-3">
                {derivations.map((d) => (
                  <DerivationControl key={d.id} id={d.id} title={d.title} />
                ))}
              </ul>
            </section>
          )}

          <section className="card p-4">
            <h2 className="font-semibold mb-3">Log entry for week {week.id}</h2>
            <LogForm key={week.id} week={week.id} />
          </section>
        </aside>
      </div>
    </article>
  );
}

function DerivationControl({ id, title }: { id: string; title: string }) {
  const p = useProgress();
  const d = p.derivations[id] ?? { done: false, closedBook: false };
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="text-sm">
      <p className="font-medium">{title}</p>
      {d.done ? (
        <p className="status-done">
          Done{d.closedBook ? " closed-book" : ""} on {d.date}.{" "}
          <button type="button" className="btn ml-2" onClick={() => actions.setDerivation(id, { done: false, closedBook: false, date: undefined })}>
            Unmark
          </button>
        </p>
      ) : (
        <div className="flex flex-col gap-1 mt-1">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />I did this closed-book (no notes, no AI help)
          </label>
          <button type="button" className="btn" disabled={!confirm} onClick={() => actions.setDerivation(id, { done: true, closedBook: true })}>
            Mark derivation done
          </button>
        </div>
      )}
    </li>
  );
}
