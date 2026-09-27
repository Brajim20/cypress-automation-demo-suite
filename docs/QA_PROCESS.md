# QA process

How I'd set up QA on a Scrum team that doesn't have a defined process yet. It's written as a
working agreement, and this repo follows it, so each rule points to where it's applied.

The goal is to move testing earlier. Most of what QA prevents gets prevented in refinement,
not found in a test run at the end of the sprint.

---

## Where QA sits in the sprint

| Ceremony / phase      | What QA does                                                                                                                                                                                                                        | Output                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Refinement**        | Reads each story before it's estimated. Asks about the edges: empty, too long, fails, slow, someone else's data, no permission.                                                                                                     | Acceptance criteria in Given/When/Then; questions answered or logged |
| **Sprint planning**   | Adds testing effort to the estimate, not as an afterthought. Flags stories that need test data, environments or third-party access.                                                                                                 | Test tasks on the board                                              |
| **During the sprint** | Writes test cases as soon as criteria are agreed, before the code exists. Pairs with the developer on which checks belong at which level (unit / API / UI). Tests each story as soon as it's deployable, not in a batch at the end. | Cases in `docs/test-cases/`, specs in the PR                         |
| **Review / demo**     | Shows what was tested and what wasn't, including known issues.                                                                                                                                                                      | Summary report                                                       |
| **Retrospective**     | Brings data: escaped bugs, flaky tests, time lost to environments.                                                                                                                                                                  | One process change to try next sprint                                |

### The refinement checklist

Questions I ask of every story. Most bugs in `docs/bugs/` would have been caught by one of
these.

1. What happens when it's **empty**? When it's at the **limit**, and one past it?
2. What does the user see when the server **fails**, is **slow**, or sends something **unexpected**?
3. What if the user's **session expires** part-way through?
4. Can one user reach **another user's** data by changing an id?
5. What if the same action happens **twice quickly**, or in **two tabs**?
6. Can it be done with **only a keyboard**? Is the error **announced**?
7. What do we **not** need to test, and why?

This repo's stories show the result: AC-01.4 (the length limit), AC-02.3 (account
enumeration) and AC-02.7 (cross-user access) were added in refinement. Questions 5 and 6 were
not asked, and the bugs they would have prevented turned up later (BUG-002, BUG-005). That's
the argument for asking them.

---

## Definition of done (quality part)

A story is done when:

- [ ] every acceptance criterion has at least one test case, and the traceability matrix is updated
- [ ] automated tests are added at the **lowest level that can catch the problem**
- [ ] any new test was seen to **fail** once, against broken or pre-fix code
- [ ] the merge gate is green **without retries**
- [ ] manual cases for the story have been run and the result recorded
- [ ] any bug found is filed, with a severity, a priority and a decision
- [ ] no new accessibility violations (axe), and keyboard use checked by hand for new UI

---

## What gets automated

Automation is an investment: it costs time to write and to maintain. The question for each
case is whether it will pay back.

| Automate when…                                                          | Keep manual when…                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| It will run many times (every PR, every release)                        | It runs once, or rarely                                                  |
| The expected result is exact and checkable                              | "Does this look/feel right?" needs judgement                             |
| It guards against a regression that has happened, or would be expensive | It depends on things outside the app (password managers, assistive tech) |
| The state is hard to reach by hand (500s, races, expiry)                | Automating it would cost more than a yearly manual check                 |

**At which level?** The cheapest one that can catch the bug:

```
Unit          validation rules, parsing, pure logic        ms, no browser
API           contract, status codes, authorization        ms, no browser
Integration   UI behaviour under stubbed network states    fast, browser
UI / E2E      real user flows through the real stack       slowest, fewest
Manual        keyboard, screen reader, visual, exploratory by a person
```

The length rule, for example, is tested 5 times in the unit layer, 4 times at the API, and
once in the UI. The UI test checks the message appears; the unit tests check the rule.

---

## Bugs

### Severity and priority are different questions

**Severity** is how bad the impact is. **Priority** is how soon we fix it. QA proposes both;
product owns priority.

| Severity | Meaning                                                                    | Example here                              |
| -------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| Critical | Data loss, security breach, or the product is unusable, with no workaround | Cross-user access (TC-API-10 guards this) |
| High     | A core function is broken or unavailable for a group of users              | BUG-005: keyboard users can't edit        |
| Medium   | Wrong behaviour with a workaround, or a silent mismatch                    | BUG-001, BUG-002                          |
| Low      | Cosmetic, confusing, or rare                                               | BUG-003, BUG-004                          |

They're filed as separate fields because they diverge. BUG-002 is Medium severity (the UI
silently disagrees with the server) but Low priority (it needs two clicks inside one slow
round trip). Writing both down lets product make that trade-off knowingly.

### A good bug report

Every report in `docs/bugs/` has the same parts. A developer should be able to act on it
without asking a question:

- **Title** that states the problem, not the area ("Quick double toggle can leave the UI
  showing the opposite of what was saved", not "Toggle bug")
- **Environment and build**
- **Actual vs expected**, kept separate
- **Numbered steps** that start from a known state, including the non-obvious precondition
- **Root cause** pointed at the line, when it can be found
- **Options for a fix** when there's a design choice, with the trade-offs, so engineering picks
- **The test to add** with the fix

### Before filing: try to disprove it

A retracted bug costs QA credibility with engineering. Before filing, check it's not the test,
the environment, or expected behaviour. SESSION-01 has an example: probe P7 first reported
that a renamed todo disappeared. The probe had read the list too early. It was never filed.

---

## Flaky tests

A flaky test is worse than no test: it teaches the team to ignore red.

1. **No automatic retries on the merge gate.** `retries: 0` in `cypress.config.ts`. A retry
   that passes hides the flake instead of reporting it.
2. **A flaky test is quarantined the day it's noticed**: tagged `@quarantine`, excluded from
   the gate, with a ticket and an owner. It stays visible in a nightly run.
3. **Quarantine has a time limit**, e.g. two sprints. After that, fix it or delete it and
   cover the risk another way.
4. **Most flakes are the test's fault**, so look there first. Usual causes: fixed waits,
   shared state between tests, acting on an element the app re-rendered, depending on a
   third-party service. Lint rules in `eslint.config.mjs` block the first and third.
5. **New tests prove stability before merging**: run the spec several times locally
   (`--spec` in a loop) before merging.

---

## Reporting

- **Per PR**: CI status, plus a comment only when something needs a human.
- **Per release**: a one-page summary for product and stakeholders. See
  [TEST_SUMMARY_REPORT.md](TEST_SUMMARY_REPORT.md). It leads with the decision and the risks,
  in plain language. Never a bare pass rate: every failure or skip is explained.
- **Per sprint (retro)**: escaped bugs and where they should have been caught, flaky test
  count, time lost to environments.

---

## Metrics worth tracking

Few, and each one tied to a decision:

| Metric                                                                | Why                                         |
| --------------------------------------------------------------------- | ------------------------------------------- |
| Bugs escaped to production, by the level that should have caught them | Shows which layer of testing is weak        |
| Flaky tests in quarantine                                             | Trust in the gate                           |
| Merge gate duration                                                   | If it's slow, people skip it                |
| Acceptance criteria with no test                                      | Coverage that matters, unlike line coverage |

Pass rate on its own is not on the list. 100% of the wrong tests is still 100%.
