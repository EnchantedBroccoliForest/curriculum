import { useState } from "react";
import type { WeekId } from "../types";
import { curriculum } from "../data";
import { actions } from "../store";
import { Field } from "./ui";

export function LogForm({ week, onSaved }: { week?: WeekId; onSaved?: () => void }) {
  const [form, setForm] = useState({ week: week ?? curriculum.weeks[0].id, dates: "", hours: "", done: "", unaided: "", stuck: "" });
  const [msg, setMsg] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const prefix = week ? `week-${week}-log` : "log";
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const hours = Number(form.hours);
        if (!Number.isFinite(hours) || hours < 0) {
          setMsg("Hours must be a non-negative number.");
          return;
        }
        actions.addLog({ week: form.week, dates: form.dates, hours, done: form.done, unaided: form.unaided, stuck: form.stuck });
        setForm((f) => ({ ...f, dates: "", hours: "", done: "", unaided: "", stuck: "" }));
        setMsg(`Saved. ${hours} h added to week ${form.week}.`);
        onSaved?.();
      }}
    >
      <Field label="Week" htmlFor={`${prefix}-week`}>
        <select id={`${prefix}-week`} className="select" value={form.week} onChange={set("week")} disabled={!!week}>
          {curriculum.weeks.map((w) => (
            <option key={w.id} value={w.id}>
              {w.id}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Dates" htmlFor={`${prefix}-dates`} hint="Free text, e.g. 2–8 Mar 2027">
        <input id={`${prefix}-dates`} className="input" value={form.dates} onChange={set("dates")} />
      </Field>
      <Field label="Hours" htmlFor={`${prefix}-hours`} hint="Added to the week's hours on save">
        <input id={`${prefix}-hours`} className="input" type="number" min="0" step="0.5" inputMode="decimal" required value={form.hours} onChange={set("hours")} />
      </Field>
      <Field label="Done" htmlFor={`${prefix}-done`}>
        <textarea id={`${prefix}-done`} className="textarea" rows={2} value={form.done} onChange={set("done")} />
      </Field>
      <Field label="Unaided derivation or answer" htmlFor={`${prefix}-unaided`} hint="Competency levels are set only from this column">
        <textarea id={`${prefix}-unaided`} className="textarea" rows={2} value={form.unaided} onChange={set("unaided")} />
      </Field>
      <Field label="Stuck on" htmlFor={`${prefix}-stuck`}>
        <textarea id={`${prefix}-stuck`} className="textarea" rows={2} value={form.stuck} onChange={set("stuck")} />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" className="btn btn-primary">
          Save log entry
        </button>
        <span role="status" className="text-sm muted">
          {msg}
        </span>
      </div>
    </form>
  );
}
