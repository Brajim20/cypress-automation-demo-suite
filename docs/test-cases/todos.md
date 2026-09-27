# Test cases · Todo list (US-01)

Written to be executable by hand. Where a case is automated, the spec title starts with the same
ID, so `grep -r TC-TODO-06 cypress/` finds it.

**Priority**: High = blocks release if failing · Medium = fix before next release · Low = backlog

---

### TC-TODO-01 · Adds todos in the order entered

- **Priority** High · **Covers** AC-01.1 · **Automated** `ui/todos.cy.ts` · `@smoke`
- **Preconditions**: signed in; list empty
- **Steps**: 1. Type `Write test plan`, press Enter. 2. Type `Review pull request`, press Enter.
- **Expected**: both appear, in that order. The input is empty after each Enter.

### TC-TODO-02 · Trims surrounding whitespace

- **Priority** Medium · **Covers** AC-01.2 · **Automated** `ui/todos.cy.ts`
- **Preconditions**: signed in; list empty
- **Steps**: 1. Type `   Buy milk   `, press Enter.
- **Expected**: one todo titled exactly `Buy milk`.

### TC-TODO-03 · Ignores a blank title

- **Priority** Medium · **Covers** AC-01.3 · **Automated** `ui/todos.cy.ts`
- **Preconditions**: signed in; list empty
- **Steps**: 1. Press Enter in the empty input. 2. Type five spaces, press Enter.
- **Expected**: nothing added; the empty state still shows; no error message.

### TC-TODO-04 · Title length boundary (200 / 201)

- **Priority** High · **Covers** AC-01.4 · **Automated** `ui/todos.cy.ts` (also TC-API-05 and unit tests)
- **Preconditions**: signed in; list empty
- **Steps**: 1. Enter a 200-character title. 2. Enter a 201-character title.
- **Expected**: 1 is added. 2 is not added, and shows "Title must be 200 characters or fewer."
  next to the input, which is marked `aria-invalid`.
- **Design note**: boundary value analysis. Test at the limit and one past it, not somewhere
  comfortably in the middle.

### TC-TODO-05 · Items-left counter pluralises correctly

- **Priority** Low · **Covers** AC-01.5 · **Automated** `ui/todos.cy.ts`
- **Preconditions**: signed in; 2 active todos, 1 completed
- **Steps**: 1. Read the counter. 2. Complete one todo. 3. Complete the other.
- **Expected**: `2 items left` → `1 item left` → `0 items left`.

### TC-TODO-06 · Completing a todo persists

- **Priority** High · **Covers** AC-01.6 · **Automated** `ui/todos.cy.ts` · `@smoke`
- **Preconditions**: signed in; an active todo "Write test plan"
- **Steps**: 1. Tick it. 2. Reload the page.
- **Expected**: shown as completed (struck through) before and after reload; counter decreases by one.

### TC-TODO-07 · Mark all as complete, and back

- **Priority** Medium · **Covers** AC-01.7 · **Automated** `ui/todos.cy.ts`
- **Preconditions**: signed in; 3 todos, mixed states
- **Steps**: 1. Tick "Mark all as complete". 2. Untick it.
- **Expected**: 1. all 3 completed, `0 items left`. 2. all 3 active, `3 items left`.

### TC-TODO-08 · Active and Completed partition All

- **Priority** High · **Covers** AC-01.8 · **Automated** `ui/todos.cy.ts` · `@smoke`
- **Preconditions**: signed in; 2 active todos, 1 completed
- **Steps**: 1. Note the titles under All. 2. Switch to Active. 3. Switch to Completed.
- **Expected**: every title from All appears in **exactly one** of Active or Completed, and
  neither view shows anything that isn't in All.
- **Design note**: checking "Active shows 2, Completed shows 1" is not enough. That also holds
  when one item is in both views and another in neither.

### TC-TODO-09 · Filter survives a reload

- **Priority** Medium · **Covers** AC-01.9 · **Automated** `ui/todos.cy.ts`
- **Preconditions**: signed in; mixed todos
- **Steps**: 1. Choose Completed. 2. Reload.
- **Expected**: URL ends `#/completed`; still filtered after reload; the Completed link is
  marked as current (`aria-current="page"`).

### TC-TODO-10 · Rename a todo

- **Priority** High · **Covers** AC-01.10 · **Automated** `ui/todos.cy.ts`
- **Preconditions**: signed in; a todo "Write test plan"
- **Steps**: 1. Double-click it. 2. Replace the text with `Write the test plan`, press Enter. 3. Reload.
- **Expected**: new title shown, before and after reload; the old title is gone.

### TC-TODO-11 · Escape discards an edit

- **Priority** Medium · **Covers** AC-01.11 · **Automated** `ui/todos.cy.ts`
- **Steps**: 1. Double-click a todo. 2. Type something else. 3. Press Escape.
- **Expected**: original title shown; edit field closed.

### TC-TODO-12 · Clearing the title while editing deletes the todo

- **Priority** Medium · **Covers** AC-01.12 · **Automated** `ui/todos.cy.ts`
- **Steps**: 1. Double-click a todo. 2. Clear the text. 3. Press Enter.
- **Expected**: the todo is removed.

### TC-TODO-13 · Delete a todo

- **Priority** High · **Covers** AC-01.13 · **Automated** `ui/todos.cy.ts`
- **Steps**: 1. Click the × on "Update regression suite". 2. Reload.
- **Expected**: removed, and still removed after reload.

### TC-TODO-14 · Clear completed

- **Priority** Medium · **Covers** AC-01.14 · **Automated** `ui/todos.cy.ts`
- **Preconditions**: 2 active, 1 completed
- **Steps**: 1. Click "Clear completed".
- **Expected**: only the completed todo is removed; the button disappears.

### TC-SEC-01 · Script-like titles render as text

- **Priority** High · **Covers** AC-01.15 · **Automated** `security/security-smoke.cy.ts` · `@smoke`
- **Steps**: add todos titled `<img src=x onerror="...">`, `<script>...</script>`,
  `"><svg onload="...">`, `javascript:...`
- **Expected**: each shows literally as typed; no image, script or SVG element is created;
  nothing executes.
