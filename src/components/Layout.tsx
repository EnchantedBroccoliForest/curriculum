import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";

const nav = [
  ["/", "Dashboard"],
  ["/plan", "Plan"],
  ["/papers", "Papers"],
  ["/competencies", "Competencies"],
  ["/derivations", "Derivations"],
  ["/checkpoints", "Checkpoints"],
  ["/log", "Log"],
  ["/reviews", "Reviews"],
  ["/resources", "Resources"],
  ["/settings", "Settings"],
] as const;

export function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn">
        Skip to content
      </a>
      <header className="border-b" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-4">
          <NavLink to="/" className="font-semibold no-underline" style={{ color: "var(--fg)" }}>
            AI curriculum
          </NavLink>
          <button
            type="button"
            className="btn md:hidden"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((o) => !o)}
          >
            Menu
          </button>
          <nav id="site-nav" aria-label="Main" className={`${open ? "block" : "hidden"} md:block absolute md:static left-0 right-0 top-12 md:top-auto z-40`} style={{ background: "var(--card)" }}>
            <ul className="flex flex-col md:flex-row md:flex-wrap gap-0 md:gap-1 px-4 md:px-0 pb-2 md:pb-0 border-b md:border-0" style={{ borderColor: "var(--line)" }}>
              {nav.map(([to, label]) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `block px-2 py-1.5 rounded text-sm no-underline ${isActive ? "font-semibold" : ""}`}
                    style={({ isActive }) => ({ color: isActive ? "var(--accent)" : "var(--fg)" })}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 flex-1">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-xs muted">
        Progress is stored in this browser only. Export it from Settings to keep it.
      </footer>
    </div>
  );
}
