import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Plan } from "./pages/Plan";
import { WeekPage } from "./pages/WeekPage";
import { Papers } from "./pages/Papers";
import { Competencies } from "./pages/Competencies";
import { Derivations } from "./pages/Derivations";
import { Checkpoints } from "./pages/Checkpoints";
import { Log } from "./pages/Log";
import { Reviews } from "./pages/Reviews";
import { Resources } from "./pages/Resources";
import { Settings } from "./pages/Settings";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/week/:id" element={<WeekPage />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/competencies" element={<Competencies />} />
        <Route path="/derivations" element={<Derivations />} />
        <Route path="/checkpoints" element={<Checkpoints />} />
        <Route path="/log" element={<Log />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Route>
    </Routes>
  );
}
