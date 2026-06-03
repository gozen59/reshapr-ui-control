# Contributing to reShapr UI Control

## Stack

- **SvelteKit** — SPA (`adapter-static`, `ssr: false`), file-based routes in `src/routes/`
- **Tailwind CSS v4** — `src/app.css` (OKLCH tokens aligned with [try.reshapr.io](https://try.reshapr.io))
- **shadcn-svelte** — `src/lib/components/ui/`, add via `npx shadcn-svelte@latest add <name>`

## Prerequisites

- Node.js 20+
- A running Reshapr control plane ([reshapr](https://github.com/reshaprio/reshapr))

## Setup

```bash
npm install
cp .env.example .env   # optional: PUBLIC_RESHAPR_SERVER
npm run dev
```

Open the Vite URL (often `http://localhost:5173`). Leave the control plane URL empty in dev to use the proxy (`/api`, `/auth` → `localhost:5555`).

## Project layout

| Path | Role |
|------|------|
| `src/routes/` | Pages (`login`, `(app)/*`) |
| `src/routes/(app)/+layout.svelte` | Shell: header, sidebar (Release 1 + Administration + Experimental), `<main>` |
| `src/routes/(app)/services/[id]/` | Service hub: layout + sub-routes (overview, artifacts, plans, expositions, MCP) |
| `src/lib/api/client.ts` | REST client (paths aligned with the CLI) |
| `src/lib/stores/auth.svelte.ts` | Session (`sessionStorage`), bootstrap, admin gating |
| `src/lib/auth/jwtClaims.ts` | JWT display claims |
| `src/lib/serviceHub.ts`, `src/lib/serviceContext.ts` | Per-service data for the hub |
| `src/lib/mcp*.ts` | MCP URL / custom tools / prompts via control plane |
| `src/lib/components/` | App components (`AppBrand`, `AppFooter`, `PageHeader`, …) |
| `src/lib/components/ui/` | shadcn-svelte primitives |
| `static/` | Favicons, `reShapr-horizontal.png`, `reShapr-icon.png` |

## UI conventions

- **Language**: user-facing copy in **English**.
- **Titles**: app name = `<h1>` in `AppBrand`; page titles = `<h2>` via `PageHeader`.
- **Theme**: light shell everywhere (header `bg-card`, sidebar `bg-sidebar`); tokens in `src/app.css` — see `docs/ARCHITECTURE.md`.
- Reuse `PageHeader`, `ApiErrorAlert`, `JsonBlock` before adding patterns.
- Destructive actions: `window.confirm` or shadcn `AlertDialog`.
- No secrets in code, commits, or docs.
- **Control plane**: UI-only repo — do not patch reshapr backend; report missing APIs upstream.

## Scripts

| Command | Use |
|---------|-----|
| `npm run dev` | Development server |
| `npm run build` | Production static build → `build/` |
| `npm run preview` | Preview `build/` |
| `npm run check` | `svelte-check` |
| `npm run test` | Vitest (`src/lib/`) |

Build artifacts (`.svelte-kit/`, `build/`) are gitignored — do not commit them.

## Before opening a PR

- [ ] `npm run check`
- [ ] `npm run build`
- [ ] `npm run test` (when touching `src/lib/`)
- [ ] No tokens or credentials in the diff
- [ ] Smoke test: login + affected routes against a local control plane

## API alignment

Keep `src/lib/api/client.ts` in sync with the Reshapr CLI. Plans and secrets use **PUT**, not PATCH. Document breaking API changes in the PR description.

## Further reading

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/reshapr-WEB_UI.md`](./docs/reshapr-WEB_UI.md) — CORS on the control plane
