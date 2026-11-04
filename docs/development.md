# Development

Use the existing checkout in each isolated cloud task; do not create a Git worktree unless explicitly requested.

## Tools and installation

Node 24 is pinned in `.nvmrc` and `.node-version`. `npm ci` installs the committed workspace lockfile. ESLint 9 is retained for compatibility with Next.js’s bundled lint plugins. The shared package contains erasable TypeScript consumed natively by Node 24 and transpiled by Next.js. API output starts at `apps/api/dist/apps/api/src/server.js`.

Run commands from the repository root unless stated otherwise. Workspace scripts run with their application's working directory. The API loads `apps/api/.env`; Next loads `apps/web/.env.local`. A root `.env` is not automatically loaded by these commands.

## MongoDB Atlas

1. Create an Atlas project and a database deployment suitable for your demo. The free tier may suffice; review current limits with MongoDB.
2. Create a dedicated database user with access to the application database, not your Atlas administrator account.
3. Permit the backend host's outbound IPs in Atlas Network Access. Prefer explicit IP ranges; do not broadly allow the Internet without reviewing the implications.
4. Copy the `mongodb+srv://` connection string into **the backend's private** `MONGODB_URI`. Percent-encode special password characters. Do not commit or paste credentials into chat.
5. Use a different database for development and production. Never point integration tests at the production database.

Atlas uses SRV/DNS and TCP, not an HTTPS API. A managed environment may require its supported TCP/VPN configuration in addition to credentials. HTTP proxy secret placeholders cannot authenticate a raw MongoDB TCP connection. Use a direct, securely injected runtime value and approved connectivity.

The API waits for a MongoDB connection before listening and exits with a clear failure if it cannot connect. `/health` reflects current database readiness.

## Optional local database

`npm run db:local` runs the official `mongod` binary through mongodb-memory-server; it uses persistent `.local/mongodb` files and requires no container. First use needs `fastdl.mongodb.org` over HTTPS and a compatible system OpenSSL runtime. Artifact verification is enabled. `npm run test:integration` uses a separate ephemeral instance and cleans it up afterward.

In restricted cloud networking, add `fastdl.mongodb.org` through environment settings. Saving a draft does not apply it to the current machine. Keep CA verification and the artifact checksum enabled. Never change the expected hash or disable checks to work around an error.

## API and cookies

For local use, keep both `WEB_URL` and the browser on `http://localhost:3000`. Next proxies `/api/*` to the server-only `API_URL` (default `http://127.0.0.1:4000`). Do not mix localhost and 127.0.0.1 in the browser; mutation origins must exactly match `WEB_URL`.

Access and refresh tokens use HTTP-only, SameSite=Lax cookies. Production adds Secure. CSRF is protected by both an exact origin check and a random cookie/header token. Browser requests fetch the header token from `/api/v1/auth/csrf`; the cookie remains HTTP-only. Refreshes are serialized by the web client to avoid accidental replay during parallel requests.

## Email

Development without SMTP/Resend writes `.eml` files in `apps/api/.local/mail/`. They contain sensitive one-time links and are gitignored. Open locally, not in a public log. Tests use a private in-process outbox to assert email flows.

For production choose one:

- Set `RESEND_API_KEY`, `MAIL_FROM` with your verified sender, and `CONTACT_EMAIL`. Messages go to `https://api.resend.com/emails`. This HTTPS transport works on hosts where outbound SMTP is restricted.
- Or set `SMTP_HOST`, `SMTP_PORT`, optionally `SMTP_USER`/`SMTP_PASS`, plus `MAIL_FROM` and `CONTACT_EMAIL`. Nodemailer uses implicit TLS on 465 or required STARTTLS on other ports. Do not disable certificate verification.

Verification/reset/invitation messages are transactional. Teammate notifications honor account settings. Activity email applies to newly created projects/tasks; editing does not send an email for every auto-save.

## AI

Only the backend reads:

```text
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=<private provider credential>
```

Use a provider's actual current supported model identifier; the default is configurable. The provider must implement `/chat/completions`, accepting system/user/assistant messages. Server-sent events are streamed to the browser; JSON responses are also handled. The key never enters `NEXT_PUBLIC_*` variables. Provider requests use the inherited HTTPS proxy/trust configuration when present.

The daily limit is 50 calls per user (UTC), persisted atomically in MongoDB, plus a per-IP minute limit. Project context is queried after workspace authorization, never accepted as an arbitrary project object from the client. Suggestions require explicit confirmation before task creation. A missing key returns `AI_UNAVAILABLE`; non-AI work remains usable.

## Demo seed

Set `SEED_EMAIL` and a strong `SEED_PASSWORD` in `apps/api/.env`, then run `npm run seed`. This creates an explicitly labeled sample workspace with a verified local seed user. It refuses production and does not overwrite an existing account's password or duplicate the workspace on repeated runs. Keep the seed password out of Git.

## Troubleshooting

| Symptom                                                  | Check                                                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| API exits before listening                               | MongoDB URI, database permissions, IP allowlist, DNS/TCP access                                            |
| Form returns CSRF/origin error                           | Browser origin must exactly match `WEB_URL`; reload to refresh the CSRF token                              |
| Next proxy returns unavailable                           | Start API; verify server-only `API_URL` and `/health`                                                      |
| Mongo binary HTTP 403 in cloud                           | Environment network policy may block `fastdl.mongodb.org`; inspect proxy evidence before changing versions |
| No email arrives locally                                 | Check `apps/api/.local/mail/`                                                                              |
| Provider rejects email                                   | Verify sender domain, recipient restrictions, account status, and private key                              |
| AI unavailable                                           | Configure backend provider key; confirm account quota and model availability                               |
| Browser tests cannot start Chromium                      | Run `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`                        |
| Cloud build has empty compiler subprocess output / EPERM | Use the environment's approved execution mode with subprocess and local port permissions                   |

## Tests

`npm test` requires a real database binary or a dedicated `TEST_MONGODB_URI` (with `test` in the database name). The integration suite drops that database. Never use an important database.

`npm run test:e2e` exercises public routes without a database. `npm run test:e2e:workspace` requires a running MongoDB, and starts the API automatically. The latter creates a unique account and real content; it does not mock the API. Use a disposable development database. CI defines separate validation and workspace-journey jobs.
