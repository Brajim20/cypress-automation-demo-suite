# BUG-005 · Keyboard users can't rename a todo

**Status**: 🔴 Open, known issue
**Found**: 27 Sep 2026, while writing manual case TC-M-01 (keyboard-only use); confirmed by
reading the code
**Standard**: WCAG 2.1 SC 2.1.1 Keyboard (Level A)
**Severity**: High for keyboard and switch users: a core feature is unavailable to them.
No impact for mouse users.
**Priority**: High. Level A is the minimum conformance level.

---

## Actual behaviour

Edit mode can only be entered by **double-clicking** a todo's title. The title is a `<label>`,
which isn't focusable, and nothing listens for a key. Tabbing through a row reaches the
checkbox and the delete button, and nothing that edits.

```js
// app/public/app.js
label.addEventListener('dblclick', () => {
  // ❌ the only way into edit mode
  state.editingId = todo.id;
  render();
});
```

The `keydown` handler further up (Enter / Escape) only runs **once you're already editing**.

## Expected behaviour

Every function available with a mouse is available from the keyboard (SC 2.1.1).

## Steps to reproduce

1. Sign in with at least one todo
2. Using only Tab, Shift+Tab, Enter and Space, try to rename a todo
3. There is no way to reach an edit control

## Why the automated a11y scan passes

axe-core checks what's in the markup: names, roles, contrast, labels. It can't know that a
double-click handler has no keyboard equivalent. This is the category of accessibility bug
that needs a person with a keyboard, and it's why TC-M-01 exists as a manual case.

## Options for a fix

- **An explicit Edit button per row.**
  - Challenge: the most discoverable option, and it works for touch too. It adds visual weight
    to each row.
- **Make the title focusable and open the editor on Enter or F2.**
  - Challenge: keeps the TodoMVC look, but the shortcut is invisible without a hint.

## Test to add with the fix

A Cypress spec that reaches edit mode using only the keyboard (focus the row's control, press
the key), plus TC-M-01 re-run by hand.
