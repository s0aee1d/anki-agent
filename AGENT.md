# AGENT.md

Root contract for humans and AI agents working in this repo. It defines boundaries, ownership and non-negotiables. Layer-specific rules live in the nested `AGENT.md` files listed at the bottom. **The nearest `AGENT.md` to the file you edit wins; this file is the floor, never the ceiling.**

## 1. Architectural boundaries

```
apps/
  server/   Node API: AnkiConnect proxy, OpenClaw chat proxy, auth/device gate
  web/      React PWA (Vite)
    src/
      ui/            product-agnostic design system (atomic design)
        atoms/
        molecules/
        organisms/
        templates/
      pages/         product-aware screens; the ONLY place UI meets data
      domain/        product types the app expects (Deck, Card, …), no runtime deps
      api/           React Query + server DTOs; maps DTOs → domain types
      state/         Jotai: all client state
      i18n/          translation setup + locale resources
      lib/           pure, product-agnostic utilities (formatting, guards, helpers)
```

Dependency direction (imports only flow downward; never up, never sideways across a layer):

```
pages  →  templates → organisms → molecules → atoms
pages  →  api, state, i18n, domain, lib
api    →  domain, lib
state  →  domain, lib
ui/*   →  lib, design tokens/styles (nothing else outside ui/)
lib    →  (nothing in this app; external packages only)
domain →  (nothing; types only)
```

- `apps/web` never imports from `apps/server` (and vice versa). The HTTP API is the only contract.
- `ui/` (the shared UI) must not import from `pages/`, `api/`, `state/`, `i18n/` or `domain/`.
- `lib/` must not import from `domain/`, `ui/`, `pages/`, `api/`, `state/` or `i18n/`.
- `domain/` imports nothing from the app. `api/` and `state/` must not import from `ui/` or `pages/`.

## 2. Responsibility ownership

| Concern | Owner |
|---|---|
| Visual primitives, layout, a11y of controls | `ui/atoms` → `ui/organisms` |
| Page skeleton / slot layout | `ui/templates` |
| Anki/OpenClaw domain knowledge, wiring data to UI, user-facing copy keys | `pages/` |
| Server data (fetch, cache, mutate, invalidate), server DTO types, DTO → domain mapping | `api/` (React Query) |
| Types the app expects (the product's shape of a Deck, Card, …) | `domain/` |
| Pure, product-agnostic helpers | `lib/` |
| Client-only state (UI prefs, drafts, selections) | `state/` (Jotai) |
| Translations | `i18n/` |
| Anki access, secrets, auth, device gate | `apps/server` |

If a piece of code has two owners, split it.

## 3. Non-negotiable constraints (global hard rules)

1. **Atomic design.** Every UI component is exactly one of atom / molecule / organism / template / page. Composition goes strictly up the ladder: atoms are indivisible; molecules compose atoms; organisms compose molecules/atoms; templates arrange organisms in slots; pages fill templates with real data.
2. **i18n-agnostic UI.** Components in `ui/` never call `t()`, import `i18n`, or contain user-visible string literals. All text arrives via props (`label`, `placeholder`, `aria-label`, …). Only `pages/` translate. No hard-coded strings anywhere in JSX outside `i18n/locales`. Only `en` exists today; code must still be locale-ready (no string concatenation for sentences, use interpolation/plurals, use `Intl` for dates/numbers).
3. **Prop-driven.** `ui/` components get everything from props. No fetching, no global state, no `window`/`localStorage` access, no context except pure presentational context (e.g. theme).
4. **Composition over configuration.** Prefer `children` and slot props (`header`, `footer`, `actions`) to boolean/enum flag sprawl. Never fork a component to add a product variant; compose it.
5. **No product domain in the shared UI.** `ui/` knows nothing about Anki, decks, cards, reviews, OpenClaw or chat semantics, and never imports `domain/`. Names are generic (`List`, `Message`, `Panel`, not `DeckList`). Domain naming starts in `pages/`.
6. **No i18n, no server state, no client state in the shared UI.** `ui/` never imports `react-i18next`/`i18n`, `@tanstack/react-query` or `jotai`. It receives text, data and setters as props.
7. **Server data = React Query. Client state = Jotai.** Never mix: no server data in atoms, no `useState`+`useEffect` fetching, no raw `fetch` outside `api/`. No Redux/Zustand/other state libs.
8. **Domain types vs server types.** `domain/` defines the types the app expects. `api/` defines its own server (DTO) types, which mirror the wire format, and maps them to domain types at the boundary (inside `queryFn`/`select`). DTO types never leave `api/`; pages, state and ui never see them.
9. **`lib/` is a leaf.** Pure functions only: no React state/context, no I/O, no domain knowledge, no imports of `domain/` or any other app layer. If a helper needs domain knowledge it belongs in `pages/` or `api/`.
10. **Tests are required.** New or changed behaviour ships with tests (see §4 and each layer's `AGENT.md`).
11. **Styling via design tokens.** No hard-coded colors, spacing or font sizes in components; use CSS variables from `styles.css`.
12. **TypeScript strict.** No `any`, no unchecked casts, no `// @ts-ignore` without a linked reason.
13. **Secrets stay on the server.** The web app never sees AnkiConnect, OpenClaw tokens or env secrets. Never commit `.env`.
14. **Accessibility is not optional.** Interactive atoms are keyboard-operable, labelled via props, and use semantic elements.
15. **One component per file**, named export matching the filename. Import from the layer index only (`ui/atoms`, not `ui/atoms/Button/Button`).
16. **Unit folders (global).** Applies to every unit in every layer: a component, a hook, a `lib` function, an `api` resource, a `state` module, a mapper. A unit that has anything beyond its own file (a test, types, hooks, styles, stories, fixtures, sub-parts…) lives in a folder named after the unit, with an `index.ts` as its public surface:
    ```
    Button/                       cx/                    decks/               app/
      index.ts                      index.ts               index.ts             index.ts
      Button.tsx                    cx.ts                  decks.ts             app.atoms.ts
      Button.test.tsx               cx.test.ts             decks.test.tsx       app.atoms.test.ts
      Button.types.ts (if needed)
    ```
    A unit with only its own file may stay flat (`Badge.tsx`, `domain/deck.ts`, `api/dto.ts`). Files inside a unit folder import each other relatively (`./Button`); anything outside imports the unit through its folder or the layer `index.ts`, never a file inside it. `index.ts` re-exports only the public surface; helpers stay unexported. Enforced by `architecture.test.ts` (every `*.test.*` must sit in a folder of the same name).

## 4. Definition of done

- `npm run build` and `npm test` pass.
- Tests added/updated for the change (colocated inside the component's folder), at the layer's level (see layer `AGENT.md`).
- No new import that violates §1.
- No new user-visible string outside `i18n/locales/en`.
- New UI component placed in the correct layer, with props-only API.

## 5. Where to find deeper rules

| Area | File |
|---|---|
| Web app overview | `apps/web/AGENT.md` |
| Atoms | `apps/web/src/ui/atoms/AGENT.md` |
| Molecules | `apps/web/src/ui/molecules/AGENT.md` |
| Organisms | `apps/web/src/ui/organisms/AGENT.md` |
| Templates | `apps/web/src/ui/templates/AGENT.md` |
| Pages | `apps/web/src/pages/AGENT.md` |
| Server data (React Query, DTOs, mapping) | `apps/web/src/api/AGENT.md` |
| Domain types | `apps/web/src/domain/AGENT.md` |
| Utilities | `apps/web/src/lib/AGENT.md` |
| Client state (Jotai) | `apps/web/src/state/AGENT.md` |
| i18n | `apps/web/src/i18n/AGENT.md` |
| Server | `apps/server/AGENT.md` |

## 6. Known deviations

- The server currently returns plain-text `error` strings, not stable codes; `api/client.ts` wraps them in `ApiError` and pages display `error.message`. Move to error codes mapped to i18n keys when the server is updated.
