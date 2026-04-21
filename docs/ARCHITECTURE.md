# Architecture reshapr-ui-control

**Index** : voir [`docs/README.md`](./README.md) pour la liste complète des documents transférés (chat, plan, règles, WEB_UI, CORS).

## Relation avec reshapr

- Control-plane Quarkus : dépôt **reshapr** (`control-plane/`, `cli/`).
- Configuration CORS côté serveur : variable `RESHAPR_HTTP_CORS_ORIGINS` + `application.properties` (voir reshapr `docs/WEB_UI.md`).

## Variables d’environnement (Vite)

| Variable | Rôle |
|----------|------|
| `VITE_RESHAPR_SERVER` | URL du control-plane par défaut dans l’UI (ex. `http://localhost:5555`). L’utilisateur peut la modifier avant connexion. |

## Authentification

- **On-premises** : `POST {server}/auth/login/reshapr` puis stockage du token + URL serveur en `sessionStorage`.
- **SaaS** : flux OAuth du CLI non reproduit ici ; message dans l’écran de connexion.

## Périmètre MVP (implémenté en navigation)

- **P0** : bootstrap affiché au login, services, import / attach artifacts, plans, expositions (liste active + toutes + création + détail + suppression).
- **P1** : secrets, groupes gateway, quotas, jetons API.
