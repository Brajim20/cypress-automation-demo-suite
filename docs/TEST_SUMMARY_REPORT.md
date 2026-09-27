# Release test summary · Todos 1.0

**Date**: 27 September 2026
**Prepared for**: product owner and stakeholders
**Tested by**: Brayan Jimenez (QA)

## Decision: ⛔ Not ready to release

**One accessibility bug blocks the release. Everything else is ready.**

People who use a keyboard instead of a mouse can't rename a todo (BUG-005). This fails the
most basic level of the accessibility standard we test against, and it affects a core feature,
so it's a blocker under our release criteria. It's a small, well-understood fix.

Once BUG-005 is fixed and the remaining manual checks are done (about an hour), I expect to
recommend release.

---

## What was tested

| Area                                                         | Result                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| Adding, completing, editing, filtering, deleting todos       | ✅ Works, including after a page reload                     |
| Signing in and out                                           | ✅ Works; wrong passwords handled; sessions end on sign-out |
| Privacy between users                                        | ✅ One user can't see or change another's todos             |
| Error handling (server down, slow, offline, session expired) | ✅ Clear messages; nothing shown as saved that wasn't       |
| Basic security checks                                        | ✅ Passed (see note below)                                  |
| Accessibility, automated scan                                | ✅ No violations found                                      |
| Accessibility, keyboard                                      | ❌ Renaming not possible without a mouse (BUG-005)          |
| Browsers                                                     | ✅ Chrome and Electron. Firefox and Safari not checked yet  |

## Open issues

| Bug     | What happens                                                                                                    | Impact | Recommendation         |
| ------- | --------------------------------------------------------------------------------------------------------------- | ------ | ---------------------- |
| BUG-005 | Keyboard users can't rename a todo                                                                              | High   | **Fix before release** |
| BUG-002 | Clicking a checkbox twice very quickly on a slow connection can show the wrong state until the page is reloaded | Medium | Next release           |
| BUG-003 | Renaming a todo to a title that's too long discards what was typed                                              | Low    | Next release           |
| BUG-004 | A todo deleted in another browser tab stays visible, with a confusing message                                   | Low    | Backlog                |

One further bug (BUG-001, the server dropping oversized requests) was found and **fixed**
during testing.

## Still to do before release

- 📋 Screen-reader check of error messages (TC-M-02)
- 📋 Test on a real slow connection (TC-M-03)
- 📋 Password-manager sign-in (TC-M-04)
- 📋 Visual check in Firefox and Safari, desktop and phone width (TC-M-05)
- 📋 Re-run the keyboard-only check once BUG-005 is fixed (TC-M-01)

## Product decisions needed

These aren't bugs. The requirements don't say what should happen, so they need a decision:

1. **Should typed text survive a session timeout?** Today, if a session expires while someone
   is typing a new todo, the text is lost when they're sent to sign in.
2. **Should extra spaces inside a title be collapsed?** `a     b` is currently kept exactly as
   typed.

---

## Details for the team

<details>
<summary>Automated test results</summary>

```
Cypress (Electron 37, Chrome 154), macOS 27
  UI                 20 passed
  Integration         9 passed
  API                10 passed
  Security smoke      6 passed
  Accessibility       4 passed
  ─────────────────────────────
  Total              49 passed, 0 failed, 0 skipped

Unit (Vitest)        38 passed, 0 failed

Stability: 6 consecutive full runs after the BUG-001 fix, 0 failures, 0 retries used
Test strength: 10 of 10 deliberately planted bugs caught (docs/TEST_PLAN.md)
Requirement coverage: 30 of 30 acceptance criteria have automated tests
```

</details>

**On "basic security checks"**: these confirm existing protections still work: that a todo
title can't run code, that sign-in doesn't reveal which emails have accounts, that sign-out ends
the session. They are not a penetration test. If the app will handle sensitive data, a proper
security review should be planned separately.
