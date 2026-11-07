import { useRef, useState } from "react";
import { curriculum } from "../data";
import { actions, exportJson, fetchRepoProgress, normalise, useProgress } from "../store";
import { Field } from "../components/ui";

export function Settings() {
  const p = useProgress();
  const [msg, setMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function download() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("Exported. Commit the file as progress.json to make it the import default.");
  }
  async function importFile(file: File) {
    try {
      const next = normalise(JSON.parse(await file.text()));
      actions.replaceAll(next);
      setMsg(`Imported ${file.name}.`);
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`);
    }
  }
  async function loadRepo() {
    const next = await fetchRepoProgress();
    if (!next) {
      setMsg("No progress.json found alongside the site.");
      return;
    }
    actions.replaceAll(next);
    setMsg("Loaded progress.json from the site.");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <section className="card p-4 mb-4 grid gap-4 sm:grid-cols-2">
        <Field label="Start date (unset until P1 begins)" htmlFor="s-start">
          <input id="s-start" type="date" className="input" value={p.startDate ?? ""} onChange={(e) => actions.setSettings({ startDate: e.target.value || undefined })} />
        </Field>
        <Field label="Target hours per week" htmlFor="s-hours" hint={`The plan assumes ${curriculum.totals.hoursPerWeek}.`}>
          <input id="s-hours" type="number" min="1" step="0.5" className="input" value={p.targetHoursPerWeek} onChange={(e) => actions.setSettings({ targetHoursPerWeek: Math.max(0.5, Number(e.target.value) || curriculum.totals.hoursPerWeek) })} />
        </Field>
        <Field label="Specialization (optional note)" htmlFor="s-spec">
          <input id="s-spec" className="input" value={p.specialization ?? ""} onChange={(e) => actions.setSettings({ specialization: e.target.value || undefined })} />
        </Field>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-2">Export and import</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" className="btn btn-primary" onClick={download}>
            Export JSON
          </button>
          <label className="btn cursor-pointer">
            Import JSON
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          </label>
          <button type="button" className="btn" onClick={loadRepo}>
            Load progress.json from the site
          </button>
        </div>
        <p role="status" className="text-sm muted mt-2">
          {msg}
        </p>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-2">Reset</h2>
        {!confirmReset ? (
          <button type="button" className="btn btn-danger" onClick={() => setConfirmReset(true)}>
            Reset all progress…
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">This deletes all progress in this browser. Export first if you want to keep it.</span>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                actions.reset();
                setConfirmReset(false);
                setMsg("Progress reset.");
              }}
            >
              Yes, reset
            </button>
            <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Canonical document</h2>
        <p className="text-sm">
          {curriculum.canonicalUrl ? (
            <a href={curriculum.canonicalUrl} target="_blank" rel="noopener noreferrer">
              {curriculum.title}
            </a>
          ) : (
            curriculum.title
          )}
          <span className="muted"> · generated from {curriculum.generatedFrom.curriculum} and {curriculum.generatedFrom.lessonPlan}</span>
        </p>
      </section>
    </div>
  );
}
