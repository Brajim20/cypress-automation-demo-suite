# Exploratory session 01 · Edges the scripted suite doesn't reach

**Date**: 27 Sep 2026 · **Timebox**: 45 min · **Tester**: Brayan Jimenez
**Build**: local app at the commit this file shipped with · **Browser**: Electron 37 (Cypress 15.21.1)

## Charter

> Explore **editing, toggling and session handling** with **concurrency, timing and boundary
> inputs** to discover **where the UI and the server can disagree, or where typed work is lost**.

The scripted suite already covers the acceptance criteria. This session went looking for what
the criteria didn't think to ask about.

## Approach

Short throwaway Cypress probes, used as a tool to observe, not to assert: arrange a state, poke
it, log what happened. Each probe was deleted after the session. The ones that found something
become the "test to add" in their bug report.

## Notes

| #   | Idea tried                                                  | Observed                                                              | Verdict                                                  |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| P1  | Delete a todo via the API, then toggle it in the stale page | Error "Todo 1 not found."; the todo stays listed                      | 🔴 [BUG-004](../bugs/BUG-004-stale-tab-deleted-todo.md)  |
| P2  | Edit a title to 201 characters                              | Banner error; edit closes; typed text discarded                       | 🔴 [BUG-003](../bugs/BUG-003-long-edit-discards-text.md) |
| P3  | Title with internal runs of spaces (`a     b`)              | Saved and shown as typed                                              | ❓ Question for product                                  |
| P4  | Toggle twice quickly                                        | UI and server agree (both active)                                     | ✅ No issue                                              |
| P4b | Toggle twice quickly, first response delayed 600 ms         | Server: active. UI: **completed**. Late reply overwrote newer state   | 🔴 [BUG-002](../bugs/BUG-002-double-toggle-race.md)      |
| P5  | 200-character unbroken word, at 1280 px and at 375 px       | Wraps; no horizontal scroll (page scrollWidth 360 < viewport 375)     | ✅ No issue                                              |
| P6  | Session revoked while adding a todo                         | Redirect to sign-in with "session expired"; the unsaved title is lost | ⚠️ Risk, see below                                       |
| P7  | Edit a title, then click elsewhere (blur)                   | Saved correctly                                                       | ✅ No issue (see below)                                  |

## Things worth recording that are not bugs

- **P7 was a false alarm, first time around.** The first probe reported the renamed todo had
  vanished. It had read the list before the save finished, with no retry. Re-run with a wait
  on the request, it was fine. Recorded because checking before filing is the job: a
  retracted bug costs more trust than a slow one.
- **P4's first attempt failed for a test reason, not an app reason.** `.click().click()` on
  the same checkbox fails because the app re-renders the row between clicks, so the second
  click hits a detached element. Real users don't hit this; tests do. It's exactly what the
  `cypress/unsafe-to-chain-command` lint rule forbids, and the page object re-queries for that
  reason.
- **P6 is a product decision, not a defect.** Losing unsaved input on session expiry is common,
  but it contradicts the spirit of US-03. Options: keep the draft in `sessionStorage` across the
  redirect, or refresh the session silently. Raised as a question rather than filed.
- **P3**: should internal whitespace collapse? Neither answer is wrong; the story doesn't say.
  Raised as a refinement question.

## Coverage this session did not reach

Screen-reader announcement of the error banner, and a real
throttled network in Chrome (the probes simulated latency with `cy.intercept`). Keyboard-only
use was picked up separately while writing TC-M-01 and filed as BUG-005. Both are
listed as manual cases in [test-cases/manual.md](../test-cases/manual.md).
