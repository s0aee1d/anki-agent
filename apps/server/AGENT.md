# apps/server — AGENT.md

Inherits the root `/AGENT.md` (§3 rules 12–13, strict TypeScript and secrets, apply here; the UI/state rules apply to the web client only).

- Owns: AnkiConnect access (`anki.ts`), OpenClaw chat proxy (`chat.ts`), auth/device gate (`auth.ts`, `devices.ts`, `gate.ts`), env parsing (`env.ts`), routing/bootstrap (`index.ts`).
- `env.ts` is the only reader of `process.env`; validate at startup, fail fast.
- Secrets and upstream URLs never appear in responses or logs.
- Route handlers are thin: validate input → call a module → shape output. Domain logic lives in modules, not in `index.ts`.
- Errors returned to the client carry a stable machine `code` (the web app translates them); never user-facing English as the contract.
- Gate/auth is enforced before any Anki or chat route.
- Tests: Vitest unit tests for modules (`anki.ts`, `gate.ts`, `devices.ts`, `env.ts`) with the upstream (AnkiConnect/OpenClaw) mocked, plus route-level tests for auth enforcement and error `code` shapes.
- The HTTP API is the only contract with `apps/web`; changing a response shape requires updating `apps/web/src/api` in the same change.
