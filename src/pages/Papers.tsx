import { Link } from "react-router-dom";
import { curriculum } from "../data";
import { actions, useProgress } from "../store";
import { Field } from "../components/ui";
import type { PaperDepth } from "../types";

const DEPTHS: PaperDepth[] = ["unread", "skim", "methods", "deep"];

export function Papers() {
  const p = useProgress();
  const count = (d: PaperDepth) => curriculum.papers.filter((x) => (p.papers[x.id]?.depth ?? "unread") === d).length;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Papers</h1>
      <p className="text-sm muted mb-4">
        {curriculum.papers.length} papers named in the plan. Counts kept separate: skimmed {count("skim")} · methods {count("methods")} · deep {count("deep")} · unread{" "}
        {count("unread")}.
      </p>
      <ul className="flex flex-col gap-3">
        {curriculum.papers.map((paper) => {
          const pp = p.papers[paper.id] ?? { depth: "unread" as PaperDepth, claim: "", evidence: "", weakest: "", judgmentFails: [] as string[] };
          return (
            <li key={paper.id} className="card p-4">
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <h2 className="font-semibold">
                  {paper.title}
                  {paper.year ? ` (${paper.year})` : ""}
                </h2>
                <span className="text-xs muted">
                  weeks{" "}
                  {paper.weeks.map((w, i) => (
                    <span key={w}>
                      {i > 0 && ", "}
                      <Link to={`/week/${w}`}>{w}</Link>
                    </span>
                  ))}
                </span>
                {paper.url && (
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-xs inline-block py-1 px-1">
                    {paper.urlStatus === "source" ? "link" : "find on arXiv"}
                  </a>
                )}
                {paper.urlStatus !== "source" && <span className="badge">unverified URL</span>}
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="Depth" htmlFor={`pd-${paper.id}`}>
                  <select id={`pd-${paper.id}`} className="select" value={pp.depth} onChange={(e) => actions.setPaper(paper.id, { depth: e.target.value as PaperDepth })}>
                    {DEPTHS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Claim" htmlFor={`pc-${paper.id}`}>
                  <textarea id={`pc-${paper.id}`} className="textarea" rows={2} value={pp.claim} onChange={(e) => actions.setPaper(paper.id, { claim: e.target.value })} />
                </Field>
                <Field label="Evidence" htmlFor={`pe-${paper.id}`}>
                  <textarea id={`pe-${paper.id}`} className="textarea" rows={2} value={pp.evidence} onChange={(e) => actions.setPaper(paper.id, { evidence: e.target.value })} />
                </Field>
                <Field label="Weakest point" htmlFor={`pw-${paper.id}`}>
                  <textarea id={`pw-${paper.id}`} className="textarea" rows={2} value={pp.weakest} onChange={(e) => actions.setPaper(paper.id, { weakest: e.target.value })} />
                </Field>
              </div>
              <fieldset className="mt-3">
                <legend className="text-xs muted mb-1">Judgment questions it fails</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {curriculum.judgmentQuestions.map((q) => (
                    <label key={q} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={pp.judgmentFails.includes(q)}
                        onChange={(e) =>
                          actions.setPaper(paper.id, {
                            judgmentFails: e.target.checked ? [...pp.judgmentFails, q] : pp.judgmentFails.filter((x) => x !== q),
                          })
                        }
                      />
                      {q}
                    </label>
                  ))}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
