# Interface web et APIs control-plane (copie pour le workspace reshapr-ui-control)

**Source canonique** : dépôt reshapr — `docs/WEB_UI.md`  
**Clone de référence** : `/Users/tmathias/WORKSPACE/GOZEN/TOOLS/reshapr/`

Les liens relatifs vers `../cli/` ou `../control-plane/` du document d’origine correspondent à ce chemin racine **reshapr**.

---

# Interface web et APIs control-plane

Ce document matérialise les choix d’architecture pour une UI web consommant les mêmes APIs que le CLI, la configuration CORS associée, et le périmètre MVP recommandé.

## 1. Hébergement et authentification (décision)

### Option retenue pour l’intégration micepe / SPA distante : **Option B — application web séparée**

- La SPA (par ex. dans le dépôt **micepe** ou **reshapr-ui-control**) est servie sur son propre origine (domaine / port).
- Elle appelle le control-plane via `fetch` en HTTPS, avec les mêmes endpoints que le CLI (`/api/config`, `/auth/login/reshapr`, `/api/v1/...`).
- **Avantages** : cycle de release indépendant, stack front libre, pas d’alourdir le JAR Quarkus.
- **Inconvénient** : nécessite une liste d’origines CORS explicites côté control-plane (voir `application.properties` et la variable `RESHAPR_HTTP_CORS_ORIGINS`).

### Option alternative : **Option A — UI embarquée dans le control-plane**

- Build front → fichiers statiques sous `control-plane/src/main/resources/META-INF/resources/`.
- **Avantages** : même origine, pas de CORS navigateur, déploiement unique.
- **Quand la préférer** : distribution « appliance » ou absence de portail existant.

### Stratégie d’authentification pour le MVP : **alignement CLI (Bearer en mémoire)**

- Après `POST /auth/login/reshapr` (on-prem) ou le flux OAuth SaaS, la SPA conserve le JWT (ou token) **en mémoire** (ou `sessionStorage`) et l’envoie en `Authorization: Bearer …` sur `/api/v1/*`, comme le CLI (`reshapr/cli/src/utils/config.ts`).
- **Évolution recommandée** : un **BFF** (Backend-for-Frontend) ou cookies `HttpOnly` si le mot de passe ne doit jamais transiter vers le navigateur ou si l’on veut réduire la surface XSS sur les tokens à longue durée de vie.

## 2. CORS et sécurité HTTP

### Configuration

- Le filtre CORS Quarkus est activé (`quarkus.http.cors=true`).
- Les origines autorisées sont pilotées par **`RESHAPR_HTTP_CORS_ORIGINS`** (liste séparée par des virgules). En l’absence de variable, des origines **localhost** courantes pour le dev SPA peuvent être utilisées (voir `reshapr/control-plane/src/main/resources/application.properties`).
- **Production** : définir explicitement `RESHAPR_HTTP_CORS_ORIGINS` avec uniquement les origines du front.

### Revue ciblée des routes sensibles

- **`/api/v1/*`** : annotées `@Authenticated` ; accès avec Bearer JWT.
- **`/api/admin/*`** : protégées par `@AdminAuthenticated` (clé API admin), hors usage CLI standard.
- **`/api/config`** : bootstrap public (mode SaaS / on-prem, version).
- **`POST /auth/login/reshapr`** : authentification on-prem.
- **`quarkus.http.auth.proactive=false`** : authentification « paresseuse ».

Les en-têtes et méthodes CORS autorisés incluent au minimum `Authorization`, `Content-Type`, et les verbes utilisés par le CLI (GET, POST, PUT, PATCH, DELETE, OPTIONS).

## 3. Périmètre MVP UI (écrans et APIs)

Objectif : couvrir le parcours « importer → plan → exposer » et la gestion courante, en réutilisant les **mêmes DTO / chemins** que le CLI.

| Priorité | Écran ou flux | Endpoints (relatif à l’URL du control-plane) | Référence CLI |
|----------|----------------|-----------------------------------------------|----------------|
| P0 | Bootstrap / choix mode | `GET /api/config` | `login.ts`, `info.ts` |
| P0 | Connexion on-prem | `POST /auth/login/reshapr` | `login.ts` |
| P0 | Liste services | `GET /api/v1/services` | `service.ts` |
| P0 | Détail / suppression service | `GET/DELETE /api/v1/services/{id}` | `service.ts` |
| P0 | Import artifact | `POST /api/v1/artifacts` | `import.ts` |
| P0 | Attacher un artifact | `POST /api/v1/artifacts/attach` | `attach.ts` |
| P0 | Plans de configuration | `GET/POST /api/v1/configurationPlans`, `GET/PUT/DELETE .../{id}`, `POST .../renewApiKey` | `import.ts`, `config.ts` |
| P0 | Expositions | `GET/POST /api/v1/expositions`, `GET/DELETE .../{id}`, `GET /api/v1/expositions/active`, `GET .../active/{id}` | `import.ts`, `expo.ts` |
| P1 | Secrets | `GET /api/v1/secrets/refs`, CRUD `/api/v1/secrets` | `secret.ts` |
| P1 | Groupes de gateways | `GET/POST /api/v1/gatewayGroups`, `DELETE .../{id}` | `gateway-group.ts` |
| P1 | Quotas tenant | `GET /api/v1/quotas` | `quotas.ts` |
| P1 | Jetons API | `POST/GET /api/v1/tokens/apiTokens`, `DELETE .../{tokenId}` | `api-token.ts` |
| — | Hors MVP console | `reshapr run` / GitHub, Docker local | `run.ts`, `stop.ts`, `status.ts` |

### Hors périmètre MVP console

- Administration globale (`/api/admin/*`, setup E2E).
- Démarrage local des conteneurs Reshapr (`run` / `stop` / `status`).

---

Pour la liste exhaustive des chemins utilisés par le CLI, voir aussi `docs/plans/api_cli_et_ui_web.md` et les `fetch` sous `reshapr/cli/src/commands/`.
