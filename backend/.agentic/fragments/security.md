## Security

### Secrets and Credentials

- Never hardcode secrets, API keys, passwords, or tokens in source code.
- Never commit `.env` files containing real credentials. Only `.env.example` with placeholder values.
- Use environment variables injected at runtime via a secrets manager (Vault, AWS Secrets Manager, etc.).
- If you accidentally expose a secret in a commit, treat it as compromised immediately — rotate it.

### Input Validation

- Validate all external inputs at the system boundary: HTTP request bodies, query params, headers,
  CLI arguments, file uploads, message queue payloads.
- Apply allowlist validation (specify what is allowed) rather than denylist (blocking known bad).
- Never trust data from the client, even if it was sent from your own frontend.
- Sanitize before rendering to the DOM (prevent XSS). Use framework-provided escaping, not manual
  string replacement.

### OWASP Top 10 Mindset

Be aware of and actively prevent:
- **Injection** (SQL, command, LDAP): use parameterized queries and avoid shell interpolation.
- **Broken Authentication**: enforce MFA, rotate tokens, invalidate sessions on logout.
- **Sensitive Data Exposure**: encrypt at rest and in transit; use TLS 1.2+ everywhere.
- **Broken Access Control**: default deny; enforce authorization at the API layer, not just UI.
- **Security Misconfiguration**: no debug endpoints in production; remove default credentials.
- **Insecure Dependencies**: run `audit` tooling regularly; pin dependency versions.
- **XSS**: output encoding in all templates; Content-Security-Policy headers.
- **Insecure Deserialization**: never deserialize untrusted data into complex objects.
- **SSRF**: validate and allowlist outbound URLs; block requests to internal network ranges.

### Dependency Management

- Pin exact versions in lockfiles (`package-lock.json`, `go.sum`, `poetry.lock`, `composer.lock`).
- Run security audits in CI: `npm audit`, `govulncheck`, `pip-audit`, `composer audit`.
- Keep dependencies up to date. Outdated dependencies are a security liability.

### HTTP Headers

Always set in production:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` (tuned to the application)
- `Referrer-Policy: strict-origin-when-cross-origin`

### Authentication & Authorization

- Hash passwords with bcrypt, argon2id, or scrypt — never MD5, SHA1, or plain SHA256.
- Use short-lived access tokens (15m–1h). Rotate refresh tokens on use.
- Authorize every request: do not assume that a valid token implies permission to every resource.
- Log authentication failures. Alert on anomalous patterns (rate limiting, geo-anomalies).
