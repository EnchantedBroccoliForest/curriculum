import { Link } from "react-router-dom";
import { curriculum } from "../data";

export function Resources() {
  const usedBy = (id: string) => curriculum.weeks.filter((w) => w.resources.includes(id)).map((w) => w.id);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Resources</h1>
      <p className="text-sm muted mb-4">Only URLs that appear in the source files are linked. Items without a URL in the source are listed unlinked.</p>
      <div className="overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Kind</th>
              <th>Status</th>
              <th>Weeks</th>
            </tr>
          </thead>
          <tbody>
            {curriculum.resources.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.name}
                    </a>
                  ) : (
                    r.name
                  )}
                </td>
                <td className="muted">{r.kind}</td>
                <td className="muted whitespace-nowrap">{r.url ? `linked (${r.source})` : "no URL in source"}</td>
                <td>
                  {usedBy(r.id).map((w, i) => (
                    <span key={w}>
                      {i > 0 && ", "}
                      <Link to={`/week/${w}`}>{w}</Link>
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="font-semibold mt-6 mb-2">Depth map</h2>
      <table className="data">
        <thead>
          <tr>
            <th>Depth</th>
            <th>Meaning</th>
            <th>Areas</th>
          </tr>
        </thead>
        <tbody>
          {curriculum.depthMap.map((d) => (
            <tr key={d.depth}>
              <td className="whitespace-nowrap">{d.depth}</td>
              <td>{d.meaning}</td>
              <td>{d.areas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
