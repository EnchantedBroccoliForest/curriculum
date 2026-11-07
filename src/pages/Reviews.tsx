import { useState } from "react";
import { curriculum } from "../data";
import { actions, addWeeks, today, useProgress } from "../store";
import { Field } from "../components/ui";

export function Reviews() {
  const p = useProgress();
  const [form, setForm] = useState({ date: today(), change: "" });
  const all = [...curriculum.reviews.map((r) => ({ ...r, source: "plan" as const })), ...p.reviews.map((r) => ({ ...r, source: "you" as const }))];

  // Pace review: mean hours/week over the last 4 logged weeks (by study week, most recent entries).
  const loggedWeeks = [...new Set(p.log.map((l) => l.week))];
  const last4 = loggedWeeks.slice(-4);
  const hoursByWeek = (w: string) => p.log.filter((l) => l.week === w).reduce((s, l) => s + l.hours, 0);
  const mean = last4.length ? last4.reduce((s, w) => s + hoursByWeek(w), 0) / last4.length : 0;
  const target = p.targetHoursPerWeek;
  const factor = mean > 0 ? target / mean : null; // calendar weeks per planned study week at this pace
  const weekNumber = (id: string) => curriculum.weeks.findIndex((w) => w.id === id) + 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Review log</h1>
      <p className="text-sm muted mb-4">Entries from the canonical plan plus the ones you add here. The pace review below previews only; it never rewrites the plan.</p>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-2">Pace review</h2>
        {last4.length < 4 ? (
          <p className="text-sm muted">Needs four logged weeks; {last4.length} so far.</p>
        ) : (
          <>
            <p className="text-sm mb-2">
              Mean over the last 4 logged weeks ({last4.join(", ")}): <strong>{mean.toFixed(1)} h/week</strong> against a target of {target}. At that pace a planned week takes{" "}
              {factor!.toFixed(2)} calendar weeks.
            </p>
            <table className="data">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Planned end (study week)</th>
                  <th>Calendar weeks from start at measured pace</th>
                  {p.startDate && <th>Projected end date</th>}
                </tr>
              </thead>
              <tbody>
                {curriculum.phases.map((ph) => {
                  const n = weekNumber(ph.weeks[1]);
                  const cal = n * factor!;
                  return (
                    <tr key={String(ph.id)}>
                      <td>{ph.name}</td>
                      <td>
                        week {ph.weeks[1]} (#{n})
                      </td>
                      <td>
                        {cal.toFixed(1)} <span className="muted">(plan: {n})</span>
                      </td>
                      {p.startDate && <td>{addWeeks(p.startDate, Math.round(cal))}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-3">Add a review entry</h2>
        <form
          className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.change.trim()) return;
            actions.addReview({ date: form.date, change: form.change.trim() });
            setForm({ date: today(), change: "" });
          }}
        >
          <Field label="Date" htmlFor="rv-date">
            <input id="rv-date" type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Change" htmlFor="rv-change">
            <input id="rv-change" className="input" value={form.change} onChange={(e) => setForm((f) => ({ ...f, change: e.target.value }))} />
          </Field>
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </section>

      <table className="data">
        <thead>
          <tr>
            <th>Date</th>
            <th>Change</th>
            <th>From</th>
          </tr>
        </thead>
        <tbody>
          {all.map((r, i) => (
            <tr key={i}>
              <td className="whitespace-nowrap">{r.date}</td>
              <td>{r.change}</td>
              <td className="muted">{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
