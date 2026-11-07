import type { Depth, WeekStatus } from "../types";

export function DepthBadge({ depth }: { depth: Depth }) {
  const label = depth === "lecture" ? "lecture-level" : depth;
  return (
    <span className={`badge badge-${depth}`} title={`Depth map: ${label}`}>
      {label}
    </span>
  );
}

export const STATUS_LABELS: Record<WeekStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
};

export function StatusSelect({ id, value, onChange, label }: { id: string; value: WeekStatus; onChange: (s: WeekStatus) => void; label: string }) {
  return (
    <select id={id} aria-label={label} className={`select status-${value}`} value={value} onChange={(e) => onChange(e.target.value as WeekStatus)}>
      {(Object.keys(STATUS_LABELS) as WeekStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="card p-4 mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs muted">{hint}</p>}
    </div>
  );
}
