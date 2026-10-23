# apps/server — AGENT.md

Inherits the root `/AGENT.md` (§3 rules 12–13, strict TypeScript and secrets, apply here; the UI/state rules apply to the web client only).

- Owns: Anki access via ankicli (`anki.ts`, `py/review.py`), OpenClaw chat proxy (`chat.ts`), auth/device gate (`auth.ts`, `devices.ts`, `gate.ts`), env parsing (`env.ts`), routing/bootstrap (`index.ts`).
- `env.ts` is the only reader of `process.env`; validate at startup, fail fast.
- Secrets and upstream URLs never appear in responses or logs.
- Route handlers are thin: validate input → call a module → shape output. Domain logic lives in modules, not in `index.ts`.
- Errors returned to the client carry a stable machine `code` (the web app translates them); never user-facing English as the contract.
- **Anki access is ankicli, not AnkiConnect, and needs no Anki desktop.** `anki.ts` shells out to `ankicli --json ...` (media path, sync, collection path) and parses the envelope; a non-`ok` envelope becomes an `Error` with its message. Calls are serialized because each one opens the collection.
- ankicli cannot render card templates and its `study grade` is local-only (never changes scheduling). Every ankicli call also costs ~0.8s (a fresh Python start). So the study hot paths run in `py/review.py`, one process per request, using the same python-anki runtime ankicli ships with: `decks` (due-tree counts), `next <deck>` (find + render the next card) and `answer <id> <ease>` (real scheduling write). It runs with `ANKI_PYTHON` (the ankicli pipx venv's Python) against the path from `ankicli collection info`. Keep it tiny; anything off the hot path goes through ankicli. Parse ankicli/python output tolerantly: python-anki dumps a "blocked main thread" stack trace to stdout on slow calls.
- Config: `ANKICLI_BIN` (default `ankicli`), `ANKI_PYTHON` (must import `anki`). Anki desktop must be closed while the server runs (the collection is single-writer).
- Gate/auth is enforced before any Anki or chat route.
- Tests: Vitest unit tests for modules (`anki.ts`, `gate.ts`, `devices.ts`, `env.ts`) with the upstream (ankicli subprocess / OpenClaw) mocked, plus route-level tests for auth enforcement and error `code` shapes.
- The HTTP API is the only contract with `apps/web`; changing a response shape requires updating `apps/web/src/api` in the same change.
