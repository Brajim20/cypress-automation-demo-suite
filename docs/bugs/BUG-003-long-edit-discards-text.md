# BUG-003 · Renaming a todo to more than 200 characters throws away what you typed

**Status**: 🔴 Open, known issue
**Found**: 27 Sep 2026, exploratory session [SESSION-01](../exploratory/SESSION-01.md), probe P2
**Environment**: local app, Cypress 15.21.1 (Electron 37), macOS
**Severity**: Low. Only the edit is lost; the existing todo is unchanged.
**Priority**: Medium. It breaks a promise made in US-03 ("never lose what I typed"), and
adding a todo already handles the same case correctly.

---

## Actual behaviour

1. Double-click a todo to edit it
2. Paste or type a title longer than 200 characters and press Enter
3. The banner says "Title must be 200 characters or fewer."
4. The edit field closes and the todo shows its **old** title. The long text is gone.

## Expected behaviour

Same as adding a todo (TC-TODO-04): the message appears **next to the field**, the field stays
open, and the typed text is kept so the user can shorten it.

## Why it's inconsistent

The add path and the edit path share `validateTitle`, but handle its failure differently:

| Path | On a too-long title                                         |
| ---- | ----------------------------------------------------------- |
| Add  | inline error, text kept in the input, `aria-invalid="true"` |
| Edit | banner error, edit closed, **text discarded**               |

## Root cause

`saveEdit` in `app/public/app.js` clears `state.editingId` before validating, so any
validation failure also ends the edit:

```js
async function saveEdit(todo, rawTitle) {
  state.editingId = null; // ❌ exits edit mode before we know the title is valid
  ...
  if (!result.ok) {
    showBanner(result.message);
```

## Suggested fix

Validate first, and only leave edit mode once the title is accepted. Show the message next to
the edit field, the way the add field does. This needs a small design decision: which element
shows the inline error in a list row.

## Test to add with the fix

`TC-TODO-15`: edit to 201 characters → edit field still open, value preserved, error visible,
original title unchanged on the server.
