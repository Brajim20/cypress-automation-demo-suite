# Test cases · Manual only

Cases that stay manual on purpose. Each one gives the reason, because "not automated" should
be a decision, not a leftover. The rules behind these decisions are in
[QA_PROCESS.md](../QA_PROCESS.md#what-gets-automated).

---

### TC-M-01 · Keyboard-only use

- **Priority** High · **Covers** AC-01.1, AC-01.6, AC-01.10, AC-01.11, AC-01.13
- **Why manual**: axe checks the markup, not whether a real keyboard flow makes sense. Focus
  order and "can I tell where I am" need a person.
- **Steps**: unplug the mouse. Sign in, add a todo, complete it, edit it, delete it, switch
  filters, sign out, using only Tab / Shift+Tab / Enter / Space / Escape.
- **Expected**: every action is reachable; focus is always visible; after deleting, focus moves
  somewhere sensible (not lost to `<body>`); Escape leaves edit mode.
- **Current result**: ❌ FAIL. There is no keyboard way into edit mode, see
  [BUG-005](../bugs/BUG-005-edit-not-keyboard-accessible.md). The other steps have not yet been
  run with a real keyboard.

### TC-M-02 · Screen reader announcements

- **Priority** Medium · **Covers** AC-03.2, AC-03.5, AC-01.4
- **Why manual**: whether an announcement is _heard_, and makes sense, is only observable with
  a screen reader running.
- **Steps**: with VoiceOver (macOS) or NVDA (Windows), trigger a load error, a save error, and
  the too-long title error.
- **Expected**: each error is announced once when it appears (the banner is `role="alert"`); the
  too-long message is read as the input's description.

### TC-M-03 · Real slow network

- **Priority** Medium · **Covers** AC-03.3, BUG-002
- **Why manual**: the automated tests fake latency with `cy.intercept`. This checks the whole
  experience on a genuinely slow link.
- **Steps**: Chrome DevTools → Network → "Slow 3G". Load, add, toggle quickly, delete.
- **Expected**: loading state visible; no duplicated or lost todos; note any UI/server mismatch
  after a reload (see BUG-002).

### TC-M-04 · Password manager autofill

- **Priority** Low · **Covers** AC-02.1
- **Why manual**: depends on browser and extension behaviour outside the app.
- **Steps**: save the demo login in the browser's password manager, sign out, return to `/login`.
- **Expected**: fields autofill (`autocomplete="username"` / `current-password`); Sign in works.

### TC-M-05 · Cross-browser visual pass

- **Priority** Medium
- **Why manual**: layout differences are faster to judge by eye than to maintain as pixel
  baselines for a UI this small.
- **Steps**: Chrome, Firefox and Safari at 1280 px and 375 px wide: empty list, full list, edit
  mode, error banner, sign-in error.
- **Expected**: no overlap, clipping or horizontal scroll; the long-title wrap from SESSION-01
  P5 holds in every browser.
