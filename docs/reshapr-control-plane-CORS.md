# Extrait CORS — dépôt reshapr (control-plane)

Chemin du fichier sur la machine de référence :

`/Users/tmathias/WORKSPACE/GOZEN/TOOLS/reshapr/control-plane/src/main/resources/application.properties`

Extrait pertinent (tel que présent après l’implémentation du plan) :

```properties
quarkus.http.cors=true
# Browser SPAs (e.g. separate micepe app). Comma-separated origins. Set in production via RESHAPR_HTTP_CORS_ORIGINS.
quarkus.http.cors.origins=${RESHAPR_HTTP_CORS_ORIGINS:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000}
quarkus.http.cors.methods=GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
quarkus.http.cors.headers=accept,accept-language,authorization,content-type,origin,x-requested-with
quarkus.http.cors.access-control-max-age=24H
quarkus.http.auth.proactive=false
```

En production : définir `RESHAPR_HTTP_CORS_ORIGINS` avec l’origine exacte du front (HTTPS).
