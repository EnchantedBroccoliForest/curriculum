import { curriculum, phaseName } from "../data";
import { actions, today, useProgress } from "../store";
import type { Level } from "../types";

const LEVELS: Level[] = ["U", 1, 2, 3, 4];

export function Competencies() {
  const p = useProgress();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Competency ledger</h1>
      <p className="text-sm mb-1">{curriculum.competencyRule}</p>
      <p className="text-xs muted mb-4">
        Levels: {LEVELS.map((l) => `${l} ${curriculum.levelScale[String(l)] ?? ""}`).join(" · ")}. A level change sets the retest date to five weeks later.
      </p>
      <div className="overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Competency</th>
              <th>Set in</th>
              <th>Target</th>
              <th>Level</th>
              <th>Evidence (unaided work)</th>
              <th>Retest</th>
            </tr>
          </thead>
          <tbody>
            {curriculum.competencies.map((c, i) => {
              const cp = p.competencies[c.id] ?? { level: "U" as Level, evidence: "" };
              const overdue = cp.retestDue && cp.retestDue < today();
              return (
                <tr key={c.id}>
                  <td>
                    <span className="muted">{i + 1}.</span> {c.name}
                  </td>
                  <td className="whitespace-nowrap muted">{phaseName(c.phaseSet)}</td>
                  <td>{c.target}</td>
                  <td>
                    <select
                      className="select"
                      aria-label={`Level for ${c.name}`}
                      title="Set only from unaided work"
                      value={String(cp.level)}
                      onChange={(e) => actions.setCompetency(c.id, { level: (e.target.value === "U" ? "U" : Number(e.target.value)) as Level })}
                    >
                      {LEVELS.map((l) => (
                        <option key={String(l)} value={String(l)}>
                          {String(l)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs muted mt-1">set only from unaided work</p>
                  </td>
                  <td className="min-w-56">
                    <textarea className="textarea" rows={2} aria-label={`Evidence for ${c.name}`} value={cp.evidence} onChange={(e) => actions.setCompetency(c.id, { evidence: e.target.value })} />
                    {cp.date && <p className="text-xs muted mt-1">Level set {cp.date}</p>}
                  </td>
                  <td className={`whitespace-nowrap ${overdue ? "overdue" : ""}`}>
                    {cp.retestDue ? (
                      <>
                        {cp.retestDue}
                        {overdue && " (overdue)"}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
