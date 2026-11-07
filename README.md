# Nexora AI

**A little less busy. A lot more possible.**

A dark-first workspace for projects, tasks, rich-text notes, team collaboration, analytics, and an OpenAI-compatible assistant. Built with Next.js App Router and a separate Express/MongoDB API in an npm-workspaces monorepo. No Docker, Kubernetes, Redis, Firebase, or Supabase.

> Portfolio application. Marketing previews and optional seed entries are explicitly illustrative. Pricing is conceptual; no billing is implemented. The application reads and writes real MongoDB data. It never simulates AI answers when no provider is configured.

## Quick start

Requirements: **Node.js 24**, npm, and MongoDB Atlas (or the optional real local MongoDB helper).

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Set a private `JWT_SECRET` (at least 32 characters) in `apps/api/.env`. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For Atlas, set `MONGODB_URI` in `apps/api/.env`; follow [database setup](docs/development.md#mongodb-atlas). For development without Atlas, run this in another terminal:

```bash
npm run db:local
```

This downloads and MD5-verifies the pinned official MongoDB 8.0.17 binary over verified TLS, runs a real `mongod` on `127.0.0.1:27017`, and retains development data in `.local/mongodb`. It is a **local development tool**, not the production database. First use requires network access to `fastdl.mongodb.org`. No binary is downloaded during installation.

```bash
npm run dev
```

Web: port 3000. API: port 4000. Database-aware API readiness: `GET /health`. Register your own account. In development without an email provider, verification/reset/invitation messages are written as `.eml` files under `apps/api/.local/mail/`; open those files locally to follow the links. Do not publish or commit these files.

## Commands

| Command                      | Purpose                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev`                | Concurrent frontend and backend development                                                   |
| `npm run build`              | Strict shared/API compilation and production Next.js build                                    |
| `npm run lint`               | ESLint and TypeScript checks                                                                  |
| `npm run test:unit`          | Validation, CSRF, token, sanitization, and pagination tests                                   |
| `npm run test:integration`   | Authentication, sessions, tenant isolation, permissions, and persistence against real MongoDB |
| `npm test`                   | Both unit and database integration suites                                                     |
| `npm run test:e2e`           | Chromium desktop/mobile public journeys against the production build                          |
| `npm run test:e2e:workspace` | Registration → project → task → note → logout against real API/MongoDB                        |
| `npm run db:local`           | Optional persistent development MongoDB                                                       |
| `npm run seed`               | Optional, idempotent, clearly labeled demo seed                                               |

Install a test browser once with `npx playwright install chromium`. To use an installed Chromium in the cloud, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Build before running browser tests. Start MongoDB before the workspace browser journey. The Playwright configuration starts the production web server and, for the workspace journey, the API if not already running.

Integration tests download an isolated checksum-verified real MongoDB instance, or use `TEST_MONGODB_URI`. **That URI must target a disposable database with `test` in its name; the suite drops it.** They do not fall back to mocks or silently skip missing prerequisites.

## What’s inside

- Marketing pages, interactive labeled product illustration, responsive navigation, SEO metadata, sitemap, robots, and recovery pages.
- Registration, bcrypt passwords, email verification, single-use password resets, short-lived access JWTs, HTTP-only cookies, refresh rotation/replay revocation, and session management.
- Workspace switching, invitations, owner/admin/member permissions checked by the API.
- Project lifecycle and membership, searchable task boards/list views, drag-and-drop, subtasks, priorities, deadlines, and optimistic status changes with rollback.
- TipTap notes, queued auto-save, favorites/categories, trash/restore, and server-side HTML sanitization.
- Recharts analytics derived from real tasks and projects; activity and notification preferences.
- Persistent private AI conversations, streaming where supported, highlighted Markdown, selected project context, and user-reviewed task generation. Missing AI credentials produce an explicit unavailable state.
- Profile/avatar updates, theme preferences, active-session revocation, password changes, and confirmed account deletion.

## Structure

```text
apps/web/          Next.js, React, Tailwind, Radix/shadcn-style UI, Query, Zustand
apps/api/          Express, Mongoose, JWT sessions, email, AI transport
packages/shared/   Zod request schemas and shared input types
scripts/           Optional local database helper
tests/e2e/        Playwright user journeys
docs/              Architecture, development, security, deployment and validation
.github/workflows/ CI build/lint/test/browser checks
render.yaml        Node backend deployment blueprint
```

## Demo hosting

Recommended: **Vercel web + Render Node API + MongoDB Atlas**, with a same-origin Next.js API proxy. Vercel also supports Node/Express Functions; it is not limited to static frontend hosting. Keeping the API on a separate Node host preserves this project’s requested architecture.

See [the deployment guide](docs/deployment.md) and [Persian hosting notes](docs/hosting-fa.md). The Render blueprint is supplied for review; no account, paid service, or live deployment has been created. No Sites publishing tool was available in the coding session.

## Configuration and architecture

- [Local setup, Atlas, AI and email configuration](docs/development.md)
- [Architecture and API map](docs/architecture.md)
- [Security boundaries and operational limitations](docs/security.md)
- [Deployment and hosting tradeoffs](docs/deployment.md)
- [Validation evidence and remaining blockers](docs/validation.md)

Keep provider keys and `.env` files private. Production requires a private JWT secret, a database URI, an HTTPS web origin, and a configured email transport by default. The [deployment guide](docs/deployment.md#demo-without-an-email-provider) describes the opt-in demo mode without email delivery.
