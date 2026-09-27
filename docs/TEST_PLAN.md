# Test plan

## Scope

**Under test**: the Todos app in `app/`: a browser client, a REST API with token auth, and a
second user account for privacy checks. It ships in this repo so every test in the merge gate
runs against something local and deterministic.

**Why not a public demo site?** The previous suite (Playwright) targeted a public practice
store, which served HTTP 500 for hours while the suite was being written. A merge gate that
depends on someone else's server produces red builds that mean nothing, and a team learns to
ignore them. Local target, stubbed failure states: a red build here always means this repo broke.

**In scope**: functional behaviour of US-01..03, the API contract, authorization between
users, client behaviour under failure, a security smoke tier, WCAG 2.1 AA per UI state.

**Out of scope**: load and performance, real email, browsers other than Chrome/Electron in CI
(covered by manual TC-M-05), penetration testing.

---

## Test levels

Each level catches something the others can't. Pushing a check down to the cheapest level that
can catch it keeps the suite fast.

| Level           | Tool                      | Where                       | Catches                                                                 | Count     |
| --------------- | ------------------------- | --------------------------- | ----------------------------------------------------------------------- | --------- |
| Unit            | Vitest                    | `tests/unit/`               | Validation boundaries, parsing, and the test helpers' own logic         | 38        |
| API             | Cypress `cy.request`      | `cypress/e2e/api/`          | Contract, status codes, validation, authorization between users         | 10        |
| Integration     | Cypress + `cy.intercept`  | `cypress/e2e/integration/`  | How the UI behaves on 500s, slow replies, bad payloads, expiry, offline | 9         |
| UI / end-to-end | Cypress, real backend     | `cypress/e2e/ui/`           | User flows through the real stack, including persistence across reload  | 20        |
| Security smoke  | Cypress                   | `cypress/e2e/security/`     | Output encoding, headers, enumeration, revocation, limits, traversal    | 6         |
| Accessibility   | cypress-axe (axe-core)    | `cypress/e2e/a11y/`         | WCAG 2.1 A/AA violations in each UI state                               | 4         |
| Exploratory     | Person + throwaway probes | `docs/exploratory/`         | What nobody thought to write a case for                                 | 1 session |
| Manual          | Person                    | `docs/test-cases/manual.md` | Keyboard flow, screen reader, real network, visual                      | 5         |

## Regression suites

Times are measured test time on a MacBook, excluding Cypress start-up (~15 s).

| Suite      | What                                                   | Run                              | When                       | Time  |
| ---------- | ------------------------------------------------------ | -------------------------------- | -------------------------- | ----- |
| Smoke      | `@smoke`: 9 critical-path tests                        | `npm run test:smoke`             | Every push; after a deploy | ~2 s  |
| Regression | Everything automated (49 + 38 unit)                    | `npm test` + `npm run test:unit` | Every PR (the merge gate)  | ~10 s |
| Release    | Regression + `manual.md` + a fresh exploratory charter | by hand                          | Before each release        | ~1 h  |

`@smoke` is chosen by risk, not by speed: sign-in, add, complete, filter partition, load-error
recovery, auth rejection, create, cross-user isolation, XSS. If any of these breaks, the
release is not usable or not safe.

---

## Entry and exit criteria

**Entry** (testing a story starts when): acceptance criteria are agreed and written in
Given/When/Then; the build deploys; test data can be arranged via `POST /api/test/reset`.

**Exit** (a release can ship when):

- the regression suite passes, with **no retries**
- no open High-priority bugs
- every acceptance criterion traces to at least one passing test ([TRACEABILITY.md](TRACEABILITY.md))
- manual cases for the release have been run and recorded
- open Medium/Low bugs are listed in the summary report with a decision (fix now / next / accept)

---

## Risk assessment

| #   | Risk                                                 | Impact                     | Coverage                                       |
| --- | ---------------------------------------------------- | -------------------------- | ---------------------------------------------- |
| 1   | A user can see or change another user's todos        | Privacy breach             | TC-API-10                                      |
| 2   | The UI shows a change as saved when it wasn't        | Silent data loss, trust    | TC-NET-05, TC-NET-09; BUG-002 open             |
| 3   | Stored XSS through a todo title                      | Account takeover           | TC-SEC-01, plus CSP checked by TC-SEC-02       |
| 4   | Users can't sign in, or signed-out users get in      | Product unusable / exposed | TC-AUTH-01..06, TC-API-01                      |
| 5   | Client and server disagree on what a valid title is  | Confusing errors           | One shared module, unit-tested; TC-API-05      |
| 6   | Filters hide or duplicate todos                      | Users miss work            | TC-TODO-08                                     |
| 7   | The app is unusable with a keyboard or screen reader | Excludes users; legal      | TC-A11Y-01..04, TC-M-01, TC-M-02; BUG-005 open |

---

## Test design rules

1. **Assert behaviour, not presence.** "Three todos are visible" is true in any broken order.
   Check the order, the partition, the persisted state after a reload.
2. **Every guard must be able to fail.** See "Mutation check" below.
3. **No fixed waits.** Wait on state (`should`) or on the network (`cy.wait('@alias')`).
   `cy.wait(1000)` fails the lint.
4. **Arrange through the API, act through the UI.** Tests seed data with `cy.resetApp` and sign
   in with `cy.login` (API + `cy.session`), then click only for the behaviour under test.
   The login form itself is tested once, in `ui/login.cy.ts`.
5. **Each test sets up its own state.** `resetApp` runs in every `beforeEach`; no test depends
   on another having run.
6. **One selector strategy.** `data-cy` attributes only, through `cy.getByCy`. Styling changes
   can't break tests.
7. **Page objects hold locators and actions, never assertions.**
8. **Boundary values, not happy middles.** 200 and 201 characters; 200 emoji (2 UTF-16 units
   each).
9. **Skipped, failed and untested are three different states.** Never report one as another.

---

## Mutation check: proving the tests have teeth

A suite that passes proves nothing on its own. It might pass against broken code too. To
check, ten realistic bugs were planted in the app one at a time, and the relevant spec was run
each time:

| #   | Planted bug                                      | Caught by              |
| --- | ------------------------------------------------ | ---------------------- |
| M1  | Titles rendered with `innerHTML`                 | TC-SEC-01              |
| M2  | Todo lookup ignores which user owns it           | TC-API-10              |
| M3  | Completed filter leaks one active todo           | TC-TODO-08, TC-TODO-09 |
| M4  | Typed text not restored when a save fails        | TC-NET-05              |
| M5  | Failed toggle still shown as done                | TC-NET-09              |
| M6  | Length measured in UTF-16 units                  | TC-API-05              |
| M7  | Counter always says "items"                      | TC-TODO-05, TC-TODO-06 |
| M8  | Sign-in error reveals whether the account exists | TC-SEC-03              |
| M9  | Sign-out doesn't revoke the token                | TC-SEC-04              |
| M10 | Malformed payload rendered instead of rejected   | TC-NET-04              |

```
Planted:  10
Caught:   10  (each by the test written for that risk)
Missed:    0
```

The unit tests for `isPartition` (the helper behind TC-TODO-08) do the same thing at a smaller
scale: most of its cases are inputs the helper must **reject**.

---

## Known gaps

- **Cross-browser in CI.** CI runs Electron and Chrome only. Firefox and WebKit are a manual
  pass (TC-M-05). Adding Firefox is one line in the CI matrix; the reason it isn't there yet
  is run time, not difficulty.
- **Visual regression.** Not automated. For a UI this small, a manual visual pass per release
  is cheaper than maintaining pixel baselines across OSes.
- **Concurrency.** BUG-002 showed the client has no protection against out-of-order responses.
  The integration layer can reproduce it; a test is added with the fix.
- **Penetration testing.** The security tier checks controls this app already has. It doesn't
  look for new classes of vulnerability, and it isn't a replacement for a pentest.
