# BUG-002 · Quick double toggle can leave the UI showing the opposite of what was saved

**Status**: 🔴 Open, known issue
**Found**: 27 Sep 2026, exploratory session [SESSION-01](../exploratory/SESSION-01.md), probe P4b
**Environment**: local app, Cypress 15.21.1 (Electron 37), macOS
**Severity**: Medium. The UI and server silently disagree about a todo's state until reload.
**Priority**: Low. Needs two clicks inside one slow round-trip. Fix before any real-network
release.

---

## Actual behaviour

Ticking and unticking a todo quickly, where the first request's response is slow:

| Step                      | Server state | UI state         |
| ------------------------- | ------------ | ---------------- |
| Click 1 → PATCH `true`    | completed    | completed        |
| Click 2 → PATCH `false`   | **active**   | active           |
| Response 2 arrives        | active       | active           |
| Response 1 arrives (late) | active       | **completed** ❌ |

After a reload the UI shows the todo as active: the server was right all along, and the UI
was wrong until the reload.

## Expected behaviour

The UI reflects the most recent action. A late reply to an older request must not overwrite
newer state.

## Steps to reproduce

Manual:

1. Chrome DevTools → Network → throttle to "Slow 3G"
2. Sign in with a list that has at least one active todo
3. Double-click the todo's checkbox quickly (two separate clicks, not a double-click on the
   label)
4. Wait for both requests to finish, and note the checkbox is ticked
5. Reload, and the checkbox is now unticked

Automated repro (used in the session): delay only the first PATCH response with
`cy.intercept(..., req => req.on('response', res => res.setDelay(600)))`, toggle twice, then
compare `.completed` in the UI against `GET /api/todos`.

## Root cause

`patchTodo` in `app/public/app.js` applies every response to the todo unconditionally:

```js
const updated = await api('PATCH', `/api/todos/${todo.id}`, patch);
Object.assign(todo, updated); // ❌ applies a stale response over a newer one
```

## Options for a fix

For engineering to choose from:

- **Ignore stale responses.** Tag each request with a per-todo sequence number and only
  apply the response for the latest one.
  - Challenge: the UI stays correct, but two writes still hit the server.
- **Disable the checkbox while its request is in flight.**
  - Challenge: simplest, but the control feels sluggish on a slow connection.
- **Server-side versioning** (`If-Match` / version field, 409 on conflict).
  - Challenge: the most robust option, and it also covers two tabs. It's also the most work.

## Test to add with the fix

Promote the automated repro above to `cypress/e2e/integration/network-states.cy.ts` as
`TC-NET-10`. Before the fix is merged, confirm the new test fails without the fix.
