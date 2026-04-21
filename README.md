# reshapr-ui-control

Console web (SPA) pour le **control-plane Reshapr** : mêmes endpoints REST que le CLI (`/api/config`, `/auth/login/reshapr`, `/api/v1/...`).

## Prérequis

- Control-plane Reshapr joignable (ex. `http://localhost:5555`).
- CORS : sur le serveur Quarkus, définir `RESHAPR_HTTP_CORS_ORIGINS` pour inclure l’origine de cette app (ex. `http://localhost:5173`). Voir le dépôt **reshapr** (`docs/WEB_UI.md`, `application.properties`).

## Démarrage

```bash
npm install
cp .env.example .env   # optionnel
npm run dev
```

Ouvrir l’URL affichée par Vite (souvent `http://localhost:5173`), saisir l’URL du control-plane, puis identifiants **on-premises** (`POST /auth/login/reshapr`).

Le mode **SaaS** n’implémente pas le flux OAuth navigateur ; utilisez le CLI `reshapr login` ou étendez cette app.

## Documentation

- **Index** : [`docs/README.md`](./docs/README.md) — chat, plan Cursor, règles utilisateur, copie `WEB_UI`, CORS, etc.
- [`PLAN.md`](./PLAN.md) — synthèse plan API / faisabilité UI.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — intégration **reshapr** et variables d’environnement.
- Règles agent Cursor : [`.cursor/rules/reshapr-ui-control.mdc`](./.cursor/rules/reshapr-ui-control.mdc).

## Build production

```bash
npm run build
npm run preview
```

Les assets statiques sont dans `dist/`.

## Agent Cursor dans une autre fenêtre

**Fichier → Ouvrir le dossier…** et choisir `reshapr-ui-control`, puis lancer un agent dans ce workspace pour itérer sur l’UI sans mélanger avec le dépôt `reshapr`.
