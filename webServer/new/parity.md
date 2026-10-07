# Caddy parity

The templates in this directory are source templates, not a deployable Caddy configuration. The Nginx path remains the active implementation until generation, validation, and cutover are implemented.

| Existing Nginx template | Caddy status |
| --- | --- |
| `certificate`, `listen`, `httpsRedirect` | Caddy handles automatic TLS and HTTP-to-HTTPS; `server` configures the authorization check. Certificate storage must persist across restarts. |
| `wwwRedirect` | `wwwRedirect` defines the redirect; certificate authorization must also approve the `www` hostname. |
| `proxy` | Caddy's HTTP reverse proxy preserves the host and supports forwarded headers and WebSockets. Confirm proxy trust and application expectations before cutover. |
| `compression` | `encode gzip` is present for site, API/panel, and statics routes. |
| `apiAndPanel` | `apiAndPanel` retains the 128 MB body limit, no-index header, and robots response. |
| `site` | `site` retains locale routing. Query-string behavior must be compared with Nginx. |
| `siteBlobs` | `siteBlobs` retains local-file lookup with API fallback, but its root still requires a tenant-specific path. |
| `statics`, `cors` | `statics` retains file serving, CORS preflight, caching, and robots response. Verify file permissions and cache headers on error responses. |
| `accounts` | `accounts` retains the Keycloak script path and proxy. Nginx-specific proxy buffer tuning is not translated. |
| `search`, `databases`, `accountsDatabase` | `proxy` provides the common route body; database exposure and authentication require individual review. |
| `storage` | A draft uses an exact hostname-to-tenant map and Caddy's file server for tenant-scoped cache paths, with API fallback on cache misses. It is not included by the generator yet. Tenant-data synchronization, runtime verification, and media-header parity remain. |
| `basicAuth` | Not implemented. Caddy requires bcrypt or Argon2id hashes, not the existing htpasswd file format. The current Nginx generator produces `basicAuth` but no active template includes it. |
| `default`, `defaultHtml` | Not implemented. Define behavior for unknown HTTP hosts separately from TLS authorization. |

The certificate authorization endpoint decides whether Caddy may issue a certificate. It does not resolve a tenant, choose a deployment instance or process, or provide a tenant-specific file root. The draft storage map can be refreshed without a per-tenant Caddyfile, but an automatic update from tenant data and a validated reload are still required for zero-touch onboarding.
