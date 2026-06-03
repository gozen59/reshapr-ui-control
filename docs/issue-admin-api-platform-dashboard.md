# Upstream gap: platform admin APIs and browser OIDC

This document tracks **Release 2** features for reshapr-ui-control that cannot be completed in the UI repo alone.

## Problem

The web console needs:

1. **Platform-wide lists** of organizations and users (admin operator).
2. **OIDC / external IDP sign-in** for admin users when configured on the control plane.

Today:

| Need | Current control plane | Usable from browser SPA? |
|------|----------------------|---------------------------|
| List users | `/api/admin/users` — POST/PUT only (create/update), **no GET list** | No |
| List organizations | Created via admin user endpoints only, **no platform list** | No |
| Admin auth | `@AdminAuthenticated` — **API key** header | **Must not** embed `RESHAPR_CTRL_API_KEY` in the SPA |
| User profile | JWT claims at login (`sub`, `email`, `org`, `groups`) | Display-only in UI (Release 1 `/account`) |
| OIDC login | `reshapr.authentication.idp.*` returned in `GET /api/config` when enabled | **No authorization-code / callback flow** in control plane yet |
| SaaS OAuth | CLI uses `{server}/cli/login?redirect_uri=...` with local callback | Different model; not wired in this UI |

## Security constraints (non-negotiable for UI)

- Never ship the control plane **admin API key** in `PUBLIC_*` env vars, `sessionStorage`, or source code.
- Prefer **JWT with platform-admin role** on new `/api/v1/platform/*` endpoints, or a **BFF** that holds server-side secrets.
- OIDC tokens must use standard browser flows (PKCE, short-lived tokens); align with Quarkus OIDC or a documented callback route on the control plane.

## Suggested upstream API (reshapr issue wording)

**Title:** Tenant-safe platform admin read APIs and browser OIDC login

**Body (draft):**

> For the reshapr-ui-control SPA we need:
>
> 1. `GET /api/v1/platform/organizations` — paginated list, `@Authenticated`, requires platform-admin JWT claim.
> 2. `GET /api/v1/platform/users` — paginated list, same authorization.
> 3. Optional: `GET /api/v1/me` — current user profile (alternative to JWT-only display in the UI).
> 4. Browser OIDC: when `reshapr.authentication.idp.enabled=true`, document or implement authorization-code flow (authorize URL, redirect URI, token exchange) so the SPA can obtain a Reshapr JWT without username/password.
> 5. Issue JWT `groups` (or equivalent) including `platform-admin` for admin operators after OIDC or local login.
>
> Do not require the admin API key in browser clients.

## OIDC spike (product decision pending)

Two models exist in the reshapr ecosystem; pick one (or both by `reshapr.mode`) before UI implementation:

| Model | Config | CLI / portal reference | Browser work in UI |
|-------|--------|------------------------|-------------------|
| **On-prem IDP** | `GET /api/config` → `authenticationConfig: { enabled, url, realm }` | Keycloak-style realm URL in `application.properties` | Redirect to IdP authorize endpoint; callback route in SPA; exchange code for JWT **once control plane documents it** |
| **SaaS OAuth** | `mode: saas` | `cli/login.ts` → `/cli/login?redirect_uri=http://localhost:PORT` | Popup or redirect + callback page; receive `token` + `ctrl_url` query params |

Until a flow is implemented upstream, Release 2 login remains **on-prem username/password** for regular users only.

## UI placeholders (this repo)

Routes exist as stubs until APIs are available:

- `/admin/organizations`
- `/admin/users`

They explain the gap and link to this document.
