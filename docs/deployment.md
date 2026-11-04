# Deploying a full-stack demo

## Recommended topology

**Vercel → Next.js web → same-origin API rewrite → Render Node service → MongoDB Atlas.**

Keeping requests under the web domain avoids cross-site authentication cookies, third-party cookie restrictions and a broad CORS policy. The backend still runs as a separate Express application. No containers are required.

Vercel is not frontend-only: its official repository includes [Express](https://github.com/vercel/vercel/tree/main/examples/express) and [standalone Node server](https://github.com/vercel/vercel/tree/main/examples/node) deployments. Moving this API there would require validating function/runtime limits, database connection reuse, streaming duration and deployment packaging. That is a viable alternative, not the default configured here.

## Research evidence and plan limits

Official source examples were inspected on 2026-11-04:

- Vercel `vercel/vercel`, commit `84878e532142f0ac584953695658b324eb9e5b80`: Node and Express example readmes describe local build and deploy; the Node example includes `/health` and `/user/:id` server routes.
- Render [`render-examples/express-hello-world`](https://github.com/render-examples/express-hello-world), commit `039c34770852fb07cef7f9f0f8534c5de408b207`: a standard Node start command and `render.yaml` with `runtime: node` and `plan: free`.

Direct access to the providers' live documentation pages was blocked by the coding environment's domain policy. Exact current quotas, free-tier eligibility, sleep/cold-start behavior, SMTP/egress restrictions and commercial-use terms were **not independently verified**. Review these before choosing a plan:

- [Vercel Hobby](https://vercel.com/docs/plans/hobby) and [Functions limits](https://vercel.com/docs/functions/limitations)
- [Render free instances](https://render.com/docs/free) and [Node/Express setup](https://render.com/docs/deploy-node-express-app)
- [Atlas free clusters](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/)

Do not promise an always-on free demo. Free compute can sleep, cold starts may affect the first request, and the provider can change its terms. MongoDB lives in Atlas, so the API host's ephemeral disk does not contain application data. Use an HTTPS mail provider if the host restricts SMTP. AI provider usage is billed/limited separately from hosting.

## 1. Create the database and email transport

Create an Atlas database user and IP allowlist for the API host. Keep the URI in backend settings. Configure either SMTP or `RESEND_API_KEY`, a verified `MAIL_FROM`, and `CONTACT_EMAIL`. The production API intentionally refuses to start without a mail transport, a real database URI and a private JWT secret. Invitations and password recovery must actually work.

## 2. Deploy the API to Render

Import the GitHub repository and use the included root `render.yaml`, or create a Node web service manually:

| Setting        | Value                                    |
| -------------- | ---------------------------------------- |
| Root directory | Repository root                          |
| Runtime        | Node 24                                  |
| Build command  | `npm ci && npm run build -w @nexora/api` |
| Start command  | `npm start -w @nexora/api`               |
| Health check   | `/health`                                |

Set private runtime values:

```text
NODE_ENV=production
NODE_VERSION=24
MONGODB_URI=<Atlas connection string>
JWT_SECRET=<unique random secret, at least 32 characters>
WEB_URL=https://your-web-deployment.vercel.app
TRUST_PROXY=1
MAIL_FROM=Nexora <hello@your-verified-domain.com>
CONTACT_EMAIL=you@your-domain.com
RESEND_API_KEY=<private key>
```

Render supplies `PORT`; do not fix it to 4000 in production. With a different host, set `TRUST_PROXY` for its actual topology. Use SMTP variables instead of Resend where supported. `AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL` are optional; add them only on the backend. Restrict the API to the intended web origin. A preview frontend pointing at the production API will not be authorized by default.

Wait until the host's `/health` returns HTTP 200 with `database: connected`. A bound port or PID is not readiness.

## 3. Deploy the web to Vercel

Import the same monorepo. Select Next.js and root directory `apps/web`; enable access to files outside that directory for workspace dependencies. Use Node 24.

| Setting | Value                                                                  |
| ------- | ---------------------------------------------------------------------- |
| Install | `npm ci` using the workspace root lockfile                             |
| Build   | `npm run build` in `apps/web` (or root `npm run build -w @nexora/web`) |
| Output  | Next.js default `.next`                                                |

Set:

```text
API_URL=https://your-api.onrender.com
NEXT_PUBLIC_SITE_URL=https://your-web-deployment.vercel.app
```

`API_URL` is server-only. Do not add backend credentials to the web deployment. The Next rewrite destination is resolved during build, so rebuild the frontend after changing it. Update backend `WEB_URL` to the exact final browser origin and restart the API after choosing a domain.

## 4. Validate the actual deployment

- Register an account through the web domain. Confirm both HTTP-only cookies are set with Secure/SameSite=Lax, and the API remains same-origin from the browser.
- Receive and consume a verification email once; invite a second account and verify workspace access/role restrictions.
- Create/edit/archive a project; create/move/reload a task; auto-save/restore a note; confirm analytics change.
- Reset a password, test that old sessions are rejected, and revoke another session.
- Without an AI key, confirm the unavailable state and functioning non-AI features. With a key, check a real streamed conversation, history reload, selected-project context and approved task creation. Never treat contract mocks as provider validation.
- Confirm the API's cold start behavior, logs, timeouts and provider email/AI quotas under your chosen plan.

No deployment has been published from this coding environment. A Git push and a saved cloud configuration draft do not establish a public demo URL.

## What about Sites?

No Sites tool or publishing capability was exposed in this session. A static-site publisher alone would not run this separate long-lived Express service and Atlas database. If the Sites product you have supports a Node process, private environment values, persistent external database connections and streaming, we can adapt these start/build commands to it. Its exact capabilities must be checked before claiming it solves full-stack hosting.

## Alternative: one ordinary Node host

An ordinary host can run both `npm start -w @nexora/api` and `npm start -w @nexora/web` behind a reverse proxy, with Atlas external. Set `API_URL` to the API's internal origin during the web build, and serve the web at a single HTTPS domain. You need a supervisor for both processes and provider-appropriate proxy/TLS configuration. This avoids two public compute providers, but a dependable always-on service may require a paid plan.
