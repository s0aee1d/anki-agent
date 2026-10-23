---
name: run-anki-agent
description: Run, start, drive, test and screenshot the Anki PWA (apps/web + apps/server) against a live ankicli collection. Use when asked to run the app, check that it works, smoke-test the UI, or take screenshots.
---

# Run anki-agent

Two apps in one npm workspace: `apps/server` (Hono API on :3001, reads and writes the Anki collection through ankicli, proxies OpenClaw chat, device-approval gate) and `apps/web` (React/Vite PWA on :5173, proxies `/api` to the server). Paths below are relative to the repo root.

The agent path is `driver.mjs`: it boots an **isolated** server and Vite, drives the real UI in headless Chrome, screenshots each step and tears everything down. It never answers a card, syncs, or sends a chat message, so Anki state is not changed.

## Prerequisites

- macOS with Google Chrome at `/Applications/Google Chrome.app` (override with `CHROME_PATH=...`).
- `ankicli` installed and configured (check: `ankicli --json doctor env` and `ankicli --json collection info`). Anki desktop must be **closed** (it locks the collection). `ANKI_PYTHON` in `.env` must point at the ankicli venv's Python (see `.env.example`).
- `.env` exists at the repo root (copy `.env.example`; OpenClaw values are only needed for real chat).

## Setup

```bash
npm install          # includes playwright-core (devDependency) used by the driver
```

## Run (agent path)

```bash
node .claude/skills/run-anki-agent/driver.mjs /tmp/anki-run
```

Takes about 20 s. Prints one `ok` line per step and `PASS`, exit code 0; on failure prints `FAIL - <reason>` and writes `failure.png`. Screenshots land in the directory you pass: `1-gate.png`, `2-decks.png`, `3-review.png`, `4-chat.png`. Look at them.

Steps it covers: request access on the gate, approve the device out of band, deck list with counts, open a deck, reveal the answer (asserts the card text changed), back to the list, open and close the OpenClaw panel.

## Tests and build

```bash
npm test             # web (Vitest + Testing Library) and server (Vitest)
npm run build        # tsc --noEmit + vite build for apps/web
```

## Run (human path)

```bash
npm run dev:server   # :3001
npm run dev:web      # :5173, open it in a browser
```

The app is behind the device gate: the first visit shows "Request access" and a device ID; approve it with `npm run devices -w apps/server -- approve <ID>` (`list` / `revoke` also exist).

## Gotchas

- **Your dev servers may already be running** on 3001/5173. A second `npm run dev:server` dies with `EADDRINUSE`, and a request to `localhost:3001` silently hits the *real* server and writes to the real `data/devices.json`. The driver therefore uses ports 3011/5190 and a temp `DEVICES_FILE`. Do the same for any ad-hoc check.
- **Never rate cards, press Sync or send chat in checks** against the live collection: they change scheduling or hit AnkiWeb/OpenClaw.
- The card is rendered in a sandboxed `<iframe srcdoc>`. A screenshot taken right after the click can show it blank; wait for `page.frameLocator(".html-frame").locator("body")` first.
- One `404` console error is `/favicon.ico` (no icon in `index.html`); the driver ignores it.
- The driver writes a temporary `apps/web/vite.e2e.config.ts` (so config resolution finds `@vitejs/plugin-react`) and deletes it on exit. If a run is killed hard, delete it by hand.
- The driver must call `process.exit` at the end: the spawned servers would otherwise keep Node alive forever. Piping its output through `tail` hides progress until exit.
- macOS has no `timeout` command; use the driver's own exit code.

## Troubleshooting

- `timeout waiting for http://127.0.0.1:3011/...` -> something else holds port 3011 or 5190 (`lsof -iTCP:3011 -iTCP:5190 -sTCP:LISTEN`), or `.env` is missing.
- Deck list shows an error like "Cannot run ankicli..." -> `ankicli` is not on PATH (set `ANKICLI_BIN`); a collection-locked error -> quit Anki desktop; a `No module named anki` error -> fix `ANKI_PYTHON`.
- `Cannot find module 'playwright-core'` -> run `npm install` at the repo root.
- `executablePath` error -> set `CHROME_PATH` to your Chrome/Chromium binary.
