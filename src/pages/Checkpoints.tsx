import { curriculum } from "../data";
import { actions, useProgress } from "../store";

export function Checkpoints() {
  const p = useProgress();
  const done = curriculum.checkpoints.filter((c) => p.checkpoints[c.id]?.done).length;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Checkpoint artifacts</h1>
      <p className="text-sm muted mb-4">
        {done} of {curriculum.checkpoints.length} artifacts done.
      </p>
      {curriculum.phases.map((ph) =>
        ph.checkpoints.length === 0 ? null : (
          <section key={String(ph.id)} className="card p-4 mb-3">
            <h2 className="font-semibold mb-2">{ph.name}</h2>
            <ul className="flex flex-col gap-3">
              {ph.checkpoints.map((c) => {
                const cp = p.checkpoints[c.id] ?? { done: false };
                return (
                  <li key={c.id} className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center text-sm">
                    <label className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" checked={cp.done} onChange={(e) => actions.setCheckpoint(c.id, { done: e.target.checked })} />
                      <span className={cp.done ? "status-done" : ""}>{c.text}</span>
                    </label>
                    <input type="date" className="input" aria-label={`Date for ${c.text}`} value={cp.date ?? ""} onChange={(e) => actions.setCheckpoint(c.id, { date: e.target.value || undefined })} />
                    <input type="url" className="input sm:w-64" aria-label={`Link for ${c.text}`} placeholder="Link to the artifact" value={cp.link ?? ""} onChange={(e) => actions.setCheckpoint(c.id, { link: e.target.value || undefined })} />
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}
