# Cypress Automation Demo Suite

[![CI](https://github.com/Brajim20/cypress-automation-demo-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/Brajim20/cypress-automation-demo-suite/actions/workflows/ci.yml)
[![Cypress](https://img.shields.io/badge/Cypress-15-69D3A7?logo=cypress&logoColor=white)](https://www.cypress.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A QA project with both halves of the job: **manual test design** (user stories, acceptance
criteria, written test cases, exploratory testing, bug reports, a QA process) and **automation**
(Cypress UI, integration, API, security and accessibility tests, plus Vitest unit tests),
tied together by a traceability matrix.

**Start here:** [Test plan](docs/TEST_PLAN.md) · [QA process](docs/QA_PROCESS.md) ·
[Traceability](docs/TRACEABILITY.md) · [Release summary](docs/TEST_SUMMARY_REPORT.md) ·
[Bugs found](docs/bugs/)

---

## Quick start

```bash
git clone https://github.com/Brajim20/cypress-automation-demo-suite.git
cd cypress-automation-demo-suite
npm ci

npm test              # full Cypress suite, app started for you   (49 tests)
npm run test:smoke    # @smoke critical path only                 (9 tests)
npm run test:unit     # Vitest, no browser                        (38 tests)
npm run dev           # app + Cypress interactive runner
```

Also: `test:api`, `test:ui`, `test:security`, `test:a11y`, `test:gate` (what CI runs),
`verify` (typecheck + lint + format + unit).

No setup or `.env` needed. The app under test ships in [`app/`](app/) and starts on
`localhost:4173`.

---

## What this demonstrates

| QA skill                               | Where to look                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceptance criteria with product**   | [`docs/stories/`](docs/stories/): 3 user stories, 30 Given/When/Then criteria, plus the questions QA raised in refinement                                 |
| **Manual test cases**                  | [`docs/test-cases/`](docs/test-cases/): cases with ID, priority, preconditions, steps, expected result. Five stay manual on purpose, each with the reason |
| **Traceability**                       | [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md): criterion → test case → spec, 30/30 covered                                                               |
| **Exploratory testing**                | [`docs/exploratory/SESSION-01.md`](docs/exploratory/SESSION-01.md): a charter, notes, 3 bugs, and 1 false alarm checked and not filed                     |
| **Defect reporting**                   | [`docs/bugs/`](docs/bugs/): 5 real bugs found while building this, with severity vs priority, root cause at the line, and fix options                     |
| **UI testing (Cypress)**               | [`cypress/e2e/ui/`](cypress/e2e/ui/): 20 tests through the real backend                                                                                   |
| **Integration testing**                | [`cypress/e2e/integration/`](cypress/e2e/integration/): `cy.intercept` forcing 500s, slow replies, bad payloads, expiry, offline                          |
| **API testing**                        | [`cypress/e2e/api/`](cypress/e2e/api/): contract, validation tables, boundaries, cross-user authorization (IDOR)                                          |
| **Regression suites**                  | `@smoke` / `@regression` tags via `@cypress/grep`; suites defined in the [test plan](docs/TEST_PLAN.md#regression-suites)                                 |
| **Tests that can fail**                | [Mutation check](docs/TEST_PLAN.md#mutation-check-proving-the-tests-have-teeth): 10 planted bugs, 10 caught                                               |
| **Process where none exists**          | [`docs/QA_PROCESS.md`](docs/QA_PROCESS.md): QA in each Scrum ceremony, refinement checklist, definition of done, automation criteria, flaky-test policy   |
| **Reporting to non-technical readers** | [`docs/TEST_SUMMARY_REPORT.md`](docs/TEST_SUMMARY_REPORT.md): a one-page release sign-off                                                                 |
| **Unit testing**                       | [`tests/unit/`](tests/unit/): the app's validation module and the test helpers, with Vitest                                                               |
| **Security testing (smoke level)**     | [`cypress/e2e/security/`](cypress/e2e/security/): XSS rendering, headers, enumeration, token revocation, size limit, traversal                            |
| **Accessibility**                      | [`cypress/e2e/a11y/`](cypress/e2e/a11y/): axe-core WCAG 2.1 AA per UI state; plus a manual keyboard case that found what axe can't                        |
| **CI/CD**                              | [`.github/workflows/ci.yml`](.github/workflows/ci.yml): fast checks first, then Cypress on Electron and Chrome                                            |

---

## Cypress practices used

- **`cy.getByCy` is a custom query (`Commands.addQuery`), not a command.** Since Cypress 12,
  commands aren't retried, so a `Commands.add` wrapper around `cy.get` would assert against one
  stale lookup.
- **`cy.session` with `validate`** caches sign-in across specs, and throws the cache away if the
  server no longer accepts the token.
- **Arrange through the API, act through the UI.** Tests seed data with `cy.request` and sign in
  programmatically. The sign-in form is tested once, in its own spec.
- **Holding a response instead of delaying it.** The loading-state test holds the stubbed reply
  until the test releases it, so it can't race on a slow CI runner the way `{ delay: 1000 }`
  can.
- **Assert on the request too**, not just the UI: `cy.wait('@create').its('request.body')`.
- **`cy.env()` for secrets, `Cypress.expose()` for public config.** This is the Cypress 15 split.
  `allowCypressEnv: false` makes the deprecated `Cypress.env()` a hard error.
- **No retries, no fixed waits, no `{ force: true }`.** Retries hide flakiness. The other two
  fail the lint (`eslint-plugin-cypress`), along with chaining actions onto an element that may
  re-render.
- **`data-cy` selectors only.** Styling changes can't break tests.
- **Page objects hold locators and actions**; assertions stay in the specs.

## The app under test

A TodoMVC-style app with a REST API, token sign-in and two demo accounts, in about 700 lines of JavaScript
with no dependencies ([`app/`](app/)). It's here so the gate is deterministic, and so there's a
real network layer to stub, real auth for `cy.session`, and a second user to test
authorization against.

- `POST /api/test/reset` wipes and seeds state for each test. It's disabled when
  `NODE_ENV=production`.
- Validation lives in [`app/public/todo-logic.js`](app/public/todo-logic.js), imported by the
  browser, the server **and** the unit tests. Client and server can't drift apart on the rules.
- The demo password is in `app/server.js` and read by tests through `cy.env()`. It only ever
  runs on localhost or a CI runner.

## On the security tests

They are **security smoke tests**: automated regression checks on controls this app already
has. They catch someone reintroducing `innerHTML`, dropping a header, or leaking whether an
account exists. They are not a penetration test and don't look for new kinds of vulnerability.

## Relationship to my Playwright suite

[Playwright-automation-demo-suite](https://github.com/Brajim20/Playwright-automation-demo-suite)
applies the same test-design principles in Playwright, against public practice sites. Same
thinking, different framework. The main translations:

| Playwright                   | Cypress (here)                                  |
| ---------------------------- | ----------------------------------------------- |
| `test.extend` fixtures       | custom commands and queries, `cy.fixture`       |
| `storageState` setup project | `cy.session()` inside `cy.login()`              |
| `page.route`                 | `cy.intercept` + `cy.wait('@alias')`            |
| `request` fixture            | `cy.request`                                    |
| `async` / `await`            | command chaining; never assign a `cy.` result   |
| `--grep @smoke`              | `@cypress/grep` with `--expose grepTags=@smoke` |
| `@axe-core/playwright`       | `cypress-axe`                                   |

## Troubleshooting

**`Cypress failed to start` / `bad option: --no-sandbox`**: the shell has
`ELECTRON_RUN_AS_NODE=1` set, which VS Code's integrated terminal sometimes leaks. Run
`unset ELECTRON_RUN_AS_NODE`, or use a regular terminal.

**Why Cypress 15 and not 16?** `cypress-axe` 1.7 declares peer support up to Cypress 15. It's
pinned rather than forced past the peer range.
