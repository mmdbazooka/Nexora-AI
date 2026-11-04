# Validation record

Recorded in the managed cloud instance on **2026-11-04**. These results describe this instance and code, not a published deployment or a restored future task.

| Check                                                | Observed result                                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean `npm ci` through the configured registry proxy | Passed; install repeated with the committed lockfile, artifact/TLS verification retained                                                                         |
| Reusable onboarding install script                   | Passed: installation, private local config creation, production build and unit tests                                                                             |
| `npm run lint`                                       | Passed: ESLint plus strict API, Next route types/web, and test/tooling TypeScript checks                                                                         |
| `npm run build`                                      | Passed: shared/API compilation, optimized Next.js web build, public metadata/OG image and dashboard route compilation                                            |
| `npm run test:unit`                                  | **18 passed**, 2 files; request validation, CSRF/origin/Unicode tokens, safe rich text, token digests and pagination                                             |
| `npm run test:e2e` with system Chromium              | **12 passed**; desktop/mobile navigation, overflow checks, product preview interactions, form validation, FAQ, pricing labeling, custom 404 and SEO endpoints    |
| Production dependency audit                          | **0 known vulnerabilities** reported by the registry at the time of the check                                                                                    |
| Real MongoDB integration suite                       | **Setup failed; 12 tests did not execute**. Mongo binary download received proxy HTTP 403; direct official download checks also showed destination policy denial |
| Real workspace browser journey                       | **Not run**; requires working MongoDB/API startup                                                                                                                |
| Live AI-provider responses                           | **Not tested**; no provider credential configured. Real transport/streaming is implemented, without a response simulator                                         |
| Live email delivery / Atlas connectivity             | **Not tested**; no hosted service credentials configured                                                                                                         |
| Public deployment / Sites publication                | **Not performed**; no hosting account integration or Sites tool was available                                                                                    |

The initial browser run found a form-label accessibility issue and oversized preview icons; those were fixed before the passing rerun. An initial command sandbox blocked local ports and compiler subprocess output; approved execution resolved those restrictions for builds/browser checks. MongoDB's domain restriction remains a separate unresolved prerequisite.

## Unblock the full runtime checks

Enable **`fastdl.mongodb.org`** in the running environment's network settings, then run:

```bash
npm run test:integration
npm run db:local
# In another terminal after the local database reports ready:
npm run dev
# Or use the production web build and let Playwright start API/web:
npm run test:e2e:workspace
```

Keep checksum and TLS verification enabled. In this session the required domain was saved to the cloud configuration draft, which does not itself apply it to the running instance. An approved reachable Atlas connection with a disposable test database is another option for integration tests; it must be configured securely and needs supported TCP/DNS access.

The full-stack environment must not be described as runtime-validated until these checks complete. GitHub CI is configured to run the real database and browser journeys on its runner; its actual result must be checked separately after pushing.

## Remaining scale/product boundaries

The implementation includes core auth, workspace/project/task/note/analytics/settings/AI flows, but is a portfolio baseline. There is no billing, MFA, SSO, distributed minute limiter, transactional outbox, or commercial service guarantee. UI list views cap each filtered query at 100 matches. Historical analytics use current completion timestamps. Operational/privacy requirements and actual mail/AI provider behavior need deployment-specific validation; see the security and deployment guides.
