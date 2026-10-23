#!/usr/bin/env node
// Boots an ISOLATED copy of the app (server :3011 + vite :5190, temp device list), drives the
// real UI in headless Chrome against the live ankicli collection, screenshots each step, then tears down.
// Never answers cards, syncs, or sends chat messages, so it does not change Anki state.
// Usage (from repo root): node .claude/skills/run-anki-agent/driver.mjs [outDir]
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(process.argv[2] ?? join(tmpdir(), "anki-agent-run"));
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const API_PORT = 3011, WEB_PORT = 5190;
const tmp = mkdtempSync(join(tmpdir(), "anki-agent-"));
const DEVICES_FILE = join(tmp, "devices.json");
const viteCfg = join(ROOT, "apps/web/vite.e2e.config.ts");
mkdirSync(OUT, { recursive: true });

const procs = [];
const start = (cmd, args, opts) => {
  const p = spawn(cmd, args, { stdio: "ignore", detached: true, ...opts });
  procs.push(p);
  return p;
};
const cleanup = () => {
  for (const p of procs) try { process.kill(-p.pid); } catch {}
  rmSync(viteCfg, { force: true });
  rmSync(tmp, { recursive: true, force: true });
};
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(1));

async function waitFor(url, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { await fetch(url); return; } catch { await new Promise((r) => setTimeout(r, 300)); }
  }
  throw new Error(`timeout waiting for ${url} (is port already in use?)`);
}
const ok = (name) => console.log(`ok  ${name}`);

writeFileSync(viteCfg, `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({ plugins: [react()], server: { port: ${WEB_PORT}, strictPort: true, proxy: { "/api": "http://127.0.0.1:${API_PORT}" } } });
`);
start("npm", ["run", "dev", "-w", "apps/server"], { cwd: ROOT, env: { ...process.env, PORT: String(API_PORT), DEVICES_FILE } });
start("npx", ["vite", "--config", "vite.e2e.config.ts"], { cwd: join(ROOT, "apps/web") });
await waitFor(`http://127.0.0.1:${API_PORT}/api/auth/status`);
await waitFor(`http://localhost:${WEB_PORT}/`);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errors.push(m.text())); // 404 = favicon

try {
  // Gate: request access, approve out-of-band, page continues on its own.
  await page.goto(`http://localhost:${WEB_PORT}`);
  await page.getByRole("button", { name: "Request access" }).click();
  await page.getByText("Waiting for approval").waitFor();
  const id = (await page.locator(".text--display").innerText()).trim();
  await page.screenshot({ path: join(OUT, "1-gate.png") });
  ok(`gate pending (${id})`);
  execSync(`npm run devices -w apps/server -- approve ${id}`, { cwd: ROOT, env: { ...process.env, DEVICES_FILE }, stdio: "pipe" });

  // Deck list
  await page.waitForSelector(".button-list", { timeout: 15000 });
  const decks = await page.locator(".button-list li").allInnerTexts();
  await page.screenshot({ path: join(OUT, "2-decks.png") });
  ok(`deck list: ${decks.map((d) => d.replace(/\s+/g, " ")).join(" | ")}`);

  // Review (reveal only; no rating)
  await page.locator(".button-list li button").first().click();
  await page.waitForSelector(".html-frame, .empty-state", { timeout: 15000 });
  if (await page.locator(".html-frame").count()) {
    const frame = page.frameLocator(".html-frame").locator("body");
    await frame.waitFor();
    const q = await frame.innerText();
    await page.getByRole("button", { name: "Show answer" }).click();
    await page.getByRole("button", { name: "Good" }).waitFor();
    await page.waitForTimeout(500);
    const a = await frame.innerText();
    if (a === q) throw new Error("answer did not change after Show answer");
    ok(`review: question ${JSON.stringify(q)} -> answer ${JSON.stringify(a)}`);
  } else ok("review: empty state (nothing due)");
  await page.screenshot({ path: join(OUT, "3-review.png") });

  // Back + chat panel
  await page.getByRole("button", { name: "‹ Decks" }).click();
  await page.waitForSelector(".button-list");
  await page.getByRole("button", { name: "OpenClaw" }).click();
  await page.getByRole("dialog", { name: "Chat with OpenClaw" }).waitFor();
  await page.screenshot({ path: join(OUT, "4-chat.png") });
  await page.getByRole("button", { name: "Close" }).click();
  ok("chat panel opens and closes");

  if (errors.length) throw new Error(`console errors: ${errors.join("; ")}`);
  console.log(`PASS - screenshots in ${OUT}`);
} catch (e) {
  await page.screenshot({ path: join(OUT, "failure.png") }).catch(() => {});
  console.error(`FAIL - ${e.message}\n(screenshot: ${join(OUT, "failure.png")})`);
  process.exitCode = 1;
} finally {
  await browser.close();
  process.exit(process.exitCode ?? 0); // also runs cleanup(); spawned servers would otherwise keep us alive
}
