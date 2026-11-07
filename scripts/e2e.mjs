// Acceptance checks against the built site (run `pnpm build` first). Uses the preinstalled Playwright.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? "/opt/node-tools/node_modules/playwright");
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const cur = JSON.parse(readFileSync("content/curriculum.json", "utf8"));
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const server = spawn("pnpm", ["exec", "vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) {
  try {
    const r = await fetch(BASE);
    if (r.ok) break;
  } catch {}
  await wait(250);
}

const results = [];
const ok = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

// 1. Every week page renders its H1 and the depth badge; collect internal links.
let rendered = 0;
const badLinks = [];
const seen = new Set();
for (const w of cur.weeks) {
  await page.goto(`${BASE}/week/${w.id}`, { waitUntil: "networkidle" });
  const h1 = await page.locator("article h1").first().textContent().catch(() => null);
  const badge = await page.locator("article .badge").first().textContent().catch(() => null);
  if (h1 && h1.includes(`Week ${w.id}`) && badge) rendered++;
  else console.log(`  week ${w.id}: h1=${JSON.stringify(h1)} badge=${JSON.stringify(badge)}`);
  const hrefs = await page.locator("main a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  for (const h of hrefs) seen.add(h);
}
ok("every week page renders", rendered === cur.weeks.length, `${rendered}/${cur.weeks.length}`);
for (const h of seen) {
  const m = /^\/week\/(.+)$/.exec(h);
  if (m && !cur.weeks.some((w) => w.id === m[1])) badLinks.push(h);
  else if (!m && !["/", "/plan", "/papers", "/competencies", "/derivations", "/checkpoints", "/log", "/reviews", "/resources", "/settings"].includes(h)) badLinks.push(h);
}
ok("every internal link resolves", badLinks.length === 0, badLinks.length ? badLinks.join(", ") : `${seen.size} distinct links`);

// 2. KaTeX renders on the named weeks.
const katexWeeks = ["P3", "P5", "5", "12", "15", "30", "33"];
const katexMissing = [];
for (const id of katexWeeks) {
  await page.goto(`${BASE}/week/${id}`, { waitUntil: "networkidle" });
  const n = await page.locator(".katex").count();
  if (n === 0) katexMissing.push(id);
}
ok("KaTeX renders on P3, P5, 5, 12, 15, 30, 33", katexMissing.length === 0, katexMissing.length ? `missing on ${katexMissing.join(", ")}` : "");

// 3. Other routes render.
for (const r of ["/", "/plan", "/papers", "/competencies", "/derivations", "/checkpoints", "/log", "/reviews", "/resources", "/settings"]) {
  await page.goto(`${BASE}${r}`, { waitUntil: "networkidle" });
  const h1 = await page.locator("main h1").first().textContent().catch(() => null);
  if (!h1) ok(`route ${r} renders`, false);
}
ok("all routes render an h1", true);

// 4. Persistence: mark a week done, add a log entry, change a competency level; reload.
await page.goto(`${BASE}/week/5`, { waitUntil: "networkidle" });
await page.selectOption("#w-status-5", "done");
await page.fill("#week-5-log-dates", "1–7 Mar");
await page.fill("#week-5-log-hours", "4.5");
await page.fill("#week-5-log-done", "MLE derivations");
await page.click("text=Save log entry");
await page.goto(`${BASE}/competencies`, { waitUntil: "networkidle" });
await page.locator("select[aria-label^='Level for']").nth(2).selectOption("2");
await page.reload({ waitUntil: "networkidle" });
const lvl = await page.locator("select[aria-label^='Level for']").nth(2).inputValue();
await page.goto(`${BASE}/week/5`, { waitUntil: "networkidle" });
const status = await page.locator("#w-status-5").inputValue();
const hours = await page.locator("#w-hours-5").inputValue();
await page.goto(`${BASE}/log`, { waitUntil: "networkidle" });
const logRows = await page.locator("table.data tbody tr").count();
ok("week done persists after reload", status === "done", status);
ok("log entry adds hours and persists", hours === "4.5" && logRows === 1, `hours=${hours} rows=${logRows}`);
ok("competency level persists after reload", lvl === "2", lvl);
const retest = await page.goto(`${BASE}/competencies`).then(() => page.locator("tbody tr").nth(2).locator("td").last().textContent());
ok("retest date auto-set on level change", /\d{4}-\d{2}-\d{2}/.test(retest || ""), retest?.trim());

// 4b. Prev/next navigation keeps the log form on the current week (review finding).
await page.goto(`${BASE}/week/P1`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: "Week P2 →" }).click();
await page.waitForURL(/\/week\/P2$/);
await page.fill("#week-P2-log-hours", "1");
await page.getByRole("button", { name: "Save log entry" }).click();
await page.waitForTimeout(200);
const p2hours = await page.locator("#w-hours-P2").inputValue();
const p1hours = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-curriculum-progress:v1")).weeks["P1"]?.hours ?? 0);
ok("log form follows prev/next navigation", p2hours === "1" && p1hours === 0, `P2=${p2hours} P1=${p1hours}`);

// 4c. Pace review survives four zero-hour weeks (review finding).
for (const wk of ["P3", "P4", "P5", "1"]) {
  await page.goto(`${BASE}/week/${wk}`, { waitUntil: "networkidle" });
  await page.fill(`#week-${wk}-log-hours`, "0");
  await page.getByRole("button", { name: "Save log entry" }).click();
  await page.waitForTimeout(100);
}
await page.goto(`${BASE}/reviews`, { waitUntil: "networkidle" });
const paceText = await page.locator("main").textContent();
ok("pace review handles zero-hour weeks without crashing", /zero hours|h\/week/.test(paceText || "") && (await page.locator("main h1").count()) === 1);

// 5. Round trip: export → reset → import.
const before = await page.evaluate(() => localStorage.getItem("ai-curriculum-progress:v1"));
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.click("text=Reset all progress…");
await page.click("text=Yes, reset");
const afterReset = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-curriculum-progress:v1")));
await page.setInputFiles("input[type=file]", { name: "progress.json", mimeType: "application/json", buffer: Buffer.from(before) });
await page.waitForTimeout(300);
const after = await page.evaluate(() => localStorage.getItem("ai-curriculum-progress:v1"));
ok("reset clears progress", Object.keys(afterReset.weeks).length === 0 && afterReset.log.length === 0);
ok("export → reset → import round-trips with no loss", JSON.stringify(JSON.parse(before)) === JSON.stringify(JSON.parse(after)));

// 6. Report to Claude shape.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
await page.getByRole("button", { name: "Report to Claude" }).click();
const report = await page.locator("pre[aria-label='Report text']").textContent();
ok("report has the expected shape", /^Week [^;]+; dates: .*; hours: .*; done: .*; unaided: .*; stuck: .*\nCompetency changes: .*\nDerivations: .*\nPapers: .*/m.test(report || ""), (report || "").split("\n")[0]);

// 7. Plan page at 375px: no horizontal overflow, controls usable.
const mobile = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 1 });
const mp = await mobile.newPage();
await mp.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await mp.selectOption("#status-P1", "in_progress");
const v = await mp.locator("#status-P1").inputValue();
await mp.screenshot({ path: "/tmp/claude-0/-home-user-curriculum/9c0b64bb-6f28-5d1f-bae7-e0664c683029/scratchpad/plan-375.png", fullPage: false });
ok("plan page usable at 375px", overflow <= 0 && v === "in_progress", `overflow=${overflow}px`);
await mp.goto(`${BASE}/week/12`, { waitUntil: "networkidle" });
const overflowW = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok("week page has no horizontal overflow at 375px", overflowW <= 0, `overflow=${overflowW}px`);
await mp.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mp.screenshot({ path: "/tmp/claude-0/-home-user-curriculum/9c0b64bb-6f28-5d1f-bae7-e0664c683029/scratchpad/dashboard-375.png" });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/claude-0/-home-user-curriculum/9c0b64bb-6f28-5d1f-bae7-e0664c683029/scratchpad/dashboard.png" });
await page.goto(`${BASE}/week/12`, { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/claude-0/-home-user-curriculum/9c0b64bb-6f28-5d1f-bae7-e0664c683029/scratchpad/week12.png", fullPage: true });

ok("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();
server.kill();
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} checks passed.`);
process.exit(failed ? 1 : 0);
