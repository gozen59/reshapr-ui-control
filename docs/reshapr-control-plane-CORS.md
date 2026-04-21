# CORS excerpt — reshapr repo (control plane)

Path to the file on the reference machine:

`/Users/tmathias/WORKSPACE/GOZEN/TOOLS/reshapr/control-plane/src/main/resources/application.properties`

Relevant excerpt (as present after the plan implementation):

```properties
quarkus.http.cors=true
# Browser SPAs (e.g. separate micepe app). Comma-separated origins. Set in production via RESHAPR_HTTP_CORS_ORIGINS.
quarkus.http.cors.origins=${RESHAPR_HTTP_CORS_ORIGINS:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000}
quarkus.http.cors.methods=GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
quarkus.http.cors.headers=accept,accept-language,authorization,content-type,origin,x-requested-with
quarkus.http.cors.access-control-max-age=24H
quarkus.http.auth.proactive=false
```

In production: set `RESHAPR_HTTP_CORS_ORIGINS` to the exact front-end origin (HTTPS).
