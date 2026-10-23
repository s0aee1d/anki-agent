# anki-agent

A PWA for studying Anki decks, backed by a small Node server.

- `apps/web` — React PWA (Vite).
- `apps/server` — Hono API. It talks to your Anki collection through [ankicli](https://pypi.org/project/anki-agent-toolkit/) (no Anki desktop, no AnkiConnect), proxies OpenClaw chat, and enforces device approval.

## Anki access

The server resolves media and syncs by running `ankicli --json ...`. The study paths run in `apps/server/py/review.py`, one process per request, using the same python-anki library, because ankicli can't render card templates, its `study grade` is local-only (never changes scheduling), and each ankicli call costs ~0.8s of Python startup.

### Setup

1. Install and configure ankicli (`ankicli configure`, then `ankicli --json collection info` should show your collection).
2. Copy `.env.example` to `.env` and set `ANKI_PYTHON` to the Python of ankicli's pipx venv (it must be able to `import anki`). `ANKICLI_BIN` only needs changing if `ankicli` isn't on PATH.
3. **Quit Anki desktop** before starting the server: the collection can only be opened by one process.
4. `npm install`, then `npm run dev` in `apps/server` and `apps/web`.

Syncing uses `ankicli sync run`; log in once with `ankicli auth login`.

### Migrating from AnkiConnect

| AnkiConnect | Now |
|---|---|
| `deckNames` + `getDeckStats` | `py/review.py decks` |
| `findCards` + `cardsInfo` | `py/review.py next` |
| `answerCards` | `py/review.py answer` |
| `retrieveMediaFile` | `ankicli media resolve-path` + file read |
| `sync` | `ankicli sync run` |
