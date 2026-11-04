# Security and release checklist

Implemented boundaries:

- bcrypt cost 12; strong password minimum; 72-byte UTF-8 maximum to avoid bcrypt truncation ambiguity.
- 15-minute access JWTs with issuer/audience/algorithm restrictions and a live database session check.
- 30-day HTTP-only refresh cookies, rotation, retained recent digest replay detection, revocation on logout/password changes and explicit session controls.
- Single-use expiring password reset/email verification tokens stored only as SHA-256 digests.
- Exact trusted-origin and constant-time random cookie/header CSRF validation; no state-changing GET endpoints.
- Same-origin Next.js proxy, explicit backend CORS, Secure cookies and HTTPS web origin in production.
- Workspace scoping on every resource operation; backend role checks for membership and project deletion; foreign-project/assignee references rejected.
- Helmet, request body limits, request IDs, structured request logging without request bodies/cookie values, consistent errors, rate limits, and bounded query parameters.
- Server-side rich-text allowlisting. SVG, scripts, event attributes, remote images and arbitrary HTML links are stripped. AI Markdown does not enable raw HTML.
- Backend-only AI credentials and workspace-context authorization; structured task suggestions are schema-validated and require user approval.
- File-signature, mime and size checks for avatar data URLs. No SVG uploads.

Before a public deployment:

1. Use unique secrets and dedicated MongoDB credentials. Verify actual egress/IP allowlists and TLS. Never commit `.env` or one-time email files.
2. Configure a real transactional mail provider and verified sender. Test verification/reset/invitation delivery using your actual domain.
3. Set `WEB_URL` exactly to the browser origin. For preview deployments use a separate API/database or deliberately configure the one allowed preview origin; do not loosen CORS/origin checks to `*`.
4. Keep proxy trust to the provider's actual hop topology. Do not accept arbitrary spoofed forwarded headers.
5. Run unit/integration/browser suites, including tenant isolation and refresh replay tests. A successful build does not prove these runtime properties.
6. Review Atlas backups/retention, privacy terms, data export requirements, dependency audit, abuse controls, monitoring, and the provider's AI data handling terms.

Limitations to review before commercial/high-availability use:

- One API instance is the supported baseline; minute rate limits/stream locks are per-process. No Redis is required by this project.
- Refresh replay detection retains the most recent 64 token digests per session; older removed digests cannot revoke the current token on replay, though replay still cannot authenticate.
- Cross-collection operations are not transactional. Adopt MongoDB transactions/outbox processing for strong atomicity and reliable notifications at production scale.
- Register/login return clear errors; account enumeration and authentication abuse controls should be revisited for your risk profile.
- No MFA, enterprise SSO, audit export, payment processing or security certifications are claimed.
- Privacy/terms copy is descriptive portfolio text, not a substitute for deployment-specific legal review.
- Account deletion removes owned solo workspaces and their resources, plus private conversations/sessions; content already shared in other people's workspaces remains for collaborators. Remove sensitive shared content first.
