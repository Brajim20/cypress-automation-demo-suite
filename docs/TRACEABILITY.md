# Traceability matrix

Acceptance criterion → test case → where it runs. Read it in either direction: "is this
requirement tested?" or "if this test fails, which requirement is at risk?"

**Automated** = runs in CI on every PR · **Manual** = run per release from `test-cases/manual.md`
· **Unit** = Vitest, no browser

| Criterion | Test case(s)                              | Level                        | Where                                           | Status                                                    |
| --------- | ----------------------------------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| AC-01.1   | TC-TODO-01, TC-M-01                       | UI · Manual                  | `ui/todos.cy.ts`                                | ✅ Automated                                              |
| AC-01.2   | TC-TODO-02, TC-NET-06, TC-API-03          | UI · Integration · API       | `ui/todos.cy.ts`, `integration/…`, `api/…`      | ✅ Automated                                              |
| AC-01.3   | TC-TODO-03, TC-API-04                     | UI · API · Unit              | `ui/todos.cy.ts`, `api/…`, `todo-logic.test.ts` | ✅ Automated                                              |
| AC-01.4   | TC-TODO-04, TC-API-04, TC-API-05, TC-M-02 | UI · API · Unit · Manual     | `ui/todos.cy.ts`, `api/…`, `todo-logic.test.ts` | ✅ Automated                                              |
| AC-01.5   | TC-TODO-05                                | UI · Unit                    | `ui/todos.cy.ts`, `todo-logic.test.ts`          | ✅ Automated                                              |
| AC-01.6   | TC-TODO-06, TC-M-01                       | UI · Manual                  | `ui/todos.cy.ts`                                | ✅ Automated                                              |
| AC-01.7   | TC-TODO-07                                | UI                           | `ui/todos.cy.ts`                                | ✅ Automated                                              |
| AC-01.8   | TC-TODO-08                                | UI · Unit (the guard itself) | `ui/todos.cy.ts`, `collections.test.ts`         | ✅ Automated                                              |
| AC-01.9   | TC-TODO-09                                | UI · Unit                    | `ui/todos.cy.ts`, `todo-logic.test.ts`          | ✅ Automated                                              |
| AC-01.10  | TC-TODO-10, TC-API-07, TC-M-01            | UI · API · Manual            | `ui/todos.cy.ts`, `api/…`                       | ✅ Automated · 🔴 BUG-003 (>200 edit), BUG-005 (keyboard) |
| AC-01.11  | TC-TODO-11, TC-M-01                       | UI · Manual                  | `ui/todos.cy.ts`                                | ✅ Automated                                              |
| AC-01.12  | TC-TODO-12                                | UI                           | `ui/todos.cy.ts`                                | ✅ Automated                                              |
| AC-01.13  | TC-TODO-13, TC-API-08, TC-M-01            | UI · API · Manual            | `ui/todos.cy.ts`, `api/…`                       | ✅ Automated                                              |
| AC-01.14  | TC-TODO-14, TC-API-09                     | UI · API                     | `ui/todos.cy.ts`, `api/…`                       | ✅ Automated                                              |
| AC-01.15  | TC-SEC-01                                 | UI (security)                | `security/security-smoke.cy.ts`                 | ✅ Automated                                              |
| AC-02.1   | TC-AUTH-01, TC-M-04                       | UI · Manual                  | `ui/login.cy.ts`                                | ✅ Automated                                              |
| AC-02.2   | TC-AUTH-02                                | UI                           | `ui/login.cy.ts`                                | ✅ Automated                                              |
| AC-02.3   | TC-AUTH-03, TC-SEC-03                     | UI · API                     | `ui/login.cy.ts`, `security/…`                  | ✅ Automated                                              |
| AC-02.4   | TC-AUTH-04                                | UI                           | `ui/login.cy.ts`                                | ✅ Automated                                              |
| AC-02.5   | TC-AUTH-05, TC-API-01                     | UI · API                     | `ui/login.cy.ts`, `api/…`                       | ✅ Automated                                              |
| AC-02.6   | TC-AUTH-06, TC-SEC-04                     | UI · API                     | `ui/login.cy.ts`, `security/…`                  | ✅ Automated                                              |
| AC-02.7   | TC-API-10                                 | API                          | `api/todos-api.cy.ts`                           | ✅ Automated                                              |
| AC-03.1   | TC-NET-01                                 | Integration                  | `integration/network-states.cy.ts`              | ✅ Automated                                              |
| AC-03.2   | TC-NET-02, TC-M-02                        | Integration · Manual         | `integration/network-states.cy.ts`              | ✅ Automated                                              |
| AC-03.3   | TC-NET-03, TC-M-03                        | Integration · Manual         | `integration/network-states.cy.ts`              | ✅ Automated                                              |
| AC-03.4   | TC-NET-04                                 | Integration · Unit           | `integration/…`, `todo-logic.test.ts`           | ✅ Automated                                              |
| AC-03.5   | TC-NET-05, TC-M-02                        | Integration · Manual         | `integration/network-states.cy.ts`              | ✅ Automated                                              |
| AC-03.6   | TC-NET-09, TC-M-03                        | Integration · Manual         | `integration/network-states.cy.ts`              | ✅ Automated · 🔴 BUG-002 under concurrency               |
| AC-03.7   | TC-NET-07                                 | Integration                  | `integration/network-states.cy.ts`              | ✅ Automated                                              |
| AC-03.8   | TC-NET-08                                 | Integration                  | `integration/network-states.cy.ts`              | ✅ Automated                                              |

## Not tied to a story

| Area                            | Test case(s)         | Where                           |
| ------------------------------- | -------------------- | ------------------------------- |
| API contract (envelope, schema) | TC-API-02, TC-API-06 | `api/todos-api.cy.ts`           |
| Security headers                | TC-SEC-02            | `security/security-smoke.cy.ts` |
| Request size limit              | TC-SEC-05 (BUG-001)  | `security/security-smoke.cy.ts` |
| Path traversal                  | TC-SEC-06            | `security/security-smoke.cy.ts` |
| WCAG 2.1 AA, per UI state       | TC-A11Y-01…04        | `a11y/a11y.cy.ts`               |
| Cross-browser layout            | TC-M-05              | Manual                          |

## Coverage summary

```
Acceptance criteria:     30
  with automated tests:  30
  with manual cases too: 11
  with an open bug:       2  (AC-01.10 → BUG-003 + BUG-005, AC-03.6 → BUG-002)
  untested:               0
```

A green check on a criterion with an open bug is honest. The tests cover the criterion as
written, and the bug is in a path the criterion didn't spell out: a long edit, concurrent
toggles, keyboard-only use. Each bug names the test to add when it's fixed.
