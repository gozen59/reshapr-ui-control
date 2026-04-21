# Plan : APIs consommées par le CLI et faisabilité d’une UI web

Ce fichier reprend le plan validé pour le dépôt **reshapr** ; l’implémentation concrète de la console vit dans ce dépôt (**reshapr-ui-control**).

## Périmètre réseau du CLI

- **Base URL** : champ `server` dans la config CLI (ex. `https://try.reshapr.io`).
- **Authentification** : `Authorization: Bearer <token>` sur `/api/v1/*`, sauf bootstrap et login.

## Endpoints appelés par le CLI (control-plane)

| Zone | Méthodes / chemins (relatif à `server`) | Fichiers CLI |
|------|------------------------------------------|--------------|
| Bootstrap | `GET /api/config` | `login.ts`, `info.ts` |
| Auth on-prem | `POST /auth/login/reshapr` (JSON username/password ; réponse texte = token) | `login.ts` |
| Auth SaaS | OAuth (callback local avec `token`, `ctrl_url`) | `login.ts` |
| Artifacts | `POST /api/v1/artifacts`, `POST /api/v1/artifacts/attach` | `import.ts`, `attach.ts` |
| Plans | `GET/POST /api/v1/configurationPlans`, `GET/PATCH/DELETE /api/v1/configurationPlans/{id}`, `POST .../renewApiKey` | `import.ts`, `config.ts` |
| Expositions | `GET/POST /api/v1/expositions`, `GET/DELETE /api/v1/expositions/{id}`, `GET /api/v1/expositions/active`, `GET .../active/{id}` | `import.ts`, `expo.ts` |
| Services | `GET /api/v1/services`, `GET/DELETE /api/v1/services/{id}` | `service.ts`, `config.ts` |
| Secrets | `GET /api/v1/secrets/refs`, CRUD `/api/v1/secrets` | `secret.ts` |
| Gateway groups | `GET/POST /api/v1/gatewayGroups`, `DELETE .../{id}` | `gateway-group.ts` |
| Quotas | `GET /api/v1/quotas` | `quotas.ts` |
| API tokens | `POST/GET /api/v1/tokens/apiTokens`, `DELETE .../{tokenId}` | `api-token.ts` |

**Hors control-plane** : `run.ts` (GitHub) ; **E2E** : `/api/admin/*`.

**Sans HTTP control-plane** : `stop`, `status` (Docker local).

## Faisabilité UI web

Oui : réutiliser les mêmes APIs JSON. Points d’attention : auth (on-prem vs SaaS), CORS (`RESHAPR_HTTP_CORS_ORIGINS` sur le control-plane), `reshapr.ctrl.public-url`.

## Dépôt reshapr-ui-control

- SPA Vite + React + TypeScript, **Option B** (origine distincte du control-plane).
- Auth MVP : Bearer en `sessionStorage`, aligné CLI on-prem.
- Voir `docs/ARCHITECTURE.md` pour CORS, périmètre MVP écran par écran.
- **Transfert contexte** : tout le matériel (résumé de chat, plan Cursor complet, règles, copie WEB_UI, CORS) est indexé dans [`docs/README.md`](./docs/README.md).
