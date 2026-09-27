# BUG-004 · A todo deleted in another tab stays on screen, with an error that exposes its id

**Status**: 🔴 Open, known issue
**Found**: 27 Sep 2026, exploratory session [SESSION-01](../exploratory/SESSION-01.md), probe P1
**Environment**: local app, Cypress 15.21.1 (Electron 37), macOS
**Severity**: Low. Cosmetic and confusing; no data loss, and a reload fixes it.
**Priority**: Low.

---

## Actual behaviour

1. Open the list in two tabs
2. In tab A, delete "Alpha"
3. In tab B (not reloaded), tick "Alpha"
4. Tab B shows: **"Couldn't update that todo. Todo 1 not found."** and "Alpha" stays in the
   list. Every further click on it gives the same error.

## Expected behaviour

When the server says a todo no longer exists, remove it from the list and say so in words
the user understands, e.g. "That todo was deleted elsewhere."

## Two separate problems

1. **No resync on 404.** The client keeps showing something the server has told it is gone.
2. **Internal id in user-facing copy.** "Todo 1" is a database id. It means nothing to the
   user, and reusing server `message` strings directly in the UI is how internals leak into
   copy.

## Notes

- This is expected, not a bug, as far as authorization goes: another _user's_ todo also
  returns 404, which is TC-API-10 working as intended. The issue is only how the client
  reacts to the 404.
- Same root area as BUG-002 (the client trusts its local copy over the server). Worth fixing
  together.
